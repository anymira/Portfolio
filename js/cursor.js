// Original GPU fluid cursor: advection, pressure projection and vorticity.
document.addEventListener('DOMContentLoaded', () => {
  const layer = document.querySelector('.custom-cursor');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!layer || !fine.matches || reduced.matches) return;
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) return;
  layer.replaceChildren(canvas);
  const vertex = `#version 300 es
    in vec2 position; out vec2 uv;
    void main(){ uv=position*.5+.5; gl_Position=vec4(position,0.,1.); }`;
  const header = `#version 300 es
    precision highp float; precision highp sampler2D;
    in vec2 uv; out vec4 frag;
    uniform sampler2D source, velocity, pressure, divergence, curl;
    uniform vec2 texel, point, force;
    uniform vec3 color;
    uniform float dt, decay, aspect, radius;
    vec4 sampleLinear(sampler2D field, vec2 p) {
      vec2 size=vec2(textureSize(field,0));
      vec2 coord=p*size-.5, base=floor(coord), f=fract(coord);
      vec2 a=(base+.5)/size, b=1./size;
      return mix(mix(texture(field,a),texture(field,a+vec2(b.x,0)),f.x),
        mix(texture(field,a+vec2(0,b.y)),texture(field,a+b),f.x),f.y);
    }
  `;
  const programs = [];
  function compile(type, code) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, code); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const error = gl.getShaderInfoLog(shader); gl.deleteShader(shader); throw Error(error);
    }
    return shader;
  }
  function program(body) {
    const p = gl.createProgram();
    const vs = compile(gl.VERTEX_SHADER, vertex), fs = compile(gl.FRAGMENT_SHADER, header + body);
    gl.attachShader(p, vs); gl.attachShader(p, fs);
    gl.bindAttribLocation(p, 0, 'position'); gl.linkProgram(p);
    gl.deleteShader(vs); gl.deleteShader(fs);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(p));
    programs.push(p);
    const uniforms = {};
    for (let i=0; i<gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i++) {
      const name=gl.getActiveUniform(p,i).name; uniforms[name]=gl.getUniformLocation(p,name);
    }
    return { p, uniforms };
  }
  let advect, inject, curlPass, swirl, divergencePass, pressurePass, project, display;
  try {
    advect = program(`void main(){
      vec2 v=sampleLinear(velocity,uv).xy;
      frag=sampleLinear(source,uv-dt*v*texel)*exp(-decay*dt);
    }`);
    inject = program(`void main(){
      vec2 d=uv-point; d.x*=aspect;
      float amount=exp(-dot(d,d)/radius);
      frag=texture(source,uv)+vec4(color,0.)*amount;
    }`);
    curlPass = program(`void main(){
      float l=texture(velocity,uv-vec2(texel.x,0)).y;
      float r=texture(velocity,uv+vec2(texel.x,0)).y;
      float b=texture(velocity,uv-vec2(0,texel.y)).x;
      float t=texture(velocity,uv+vec2(0,texel.y)).x;
      frag=vec4(.5*(r-l-t+b),0,0,1);
    }`);
    swirl = program(`void main(){
      float l=abs(texture(curl,uv-vec2(texel.x,0)).x);
      float r=abs(texture(curl,uv+vec2(texel.x,0)).x);
      float b=abs(texture(curl,uv-vec2(0,texel.y)).x);
      float t=abs(texture(curl,uv+vec2(0,texel.y)).x);
      vec2 n=vec2(t-b,l-r); n/=length(n)+.0001;
      vec2 v=texture(velocity,uv).xy+n*texture(curl,uv).x*22.*dt;
      frag=vec4(clamp(v,vec2(-450.),vec2(450.)),0,1);
    }`);
    divergencePass = program(`void main(){
      vec2 v=texture(velocity,uv).xy;
      float l=texture(velocity,uv-vec2(texel.x,0)).x;
      float r=texture(velocity,uv+vec2(texel.x,0)).x;
      float b=texture(velocity,uv-vec2(0,texel.y)).y;
      float t=texture(velocity,uv+vec2(0,texel.y)).y;
      if(uv.x<texel.x) l=-v.x; if(uv.x>1.-texel.x) r=-v.x;
      if(uv.y<texel.y) b=-v.y; if(uv.y>1.-texel.y) t=-v.y;
      frag=vec4(.5*(r-l+t-b),0,0,1);
    }`);
    pressurePass = program(`void main(){
      float l=texture(pressure,uv-vec2(texel.x,0)).x;
      float r=texture(pressure,uv+vec2(texel.x,0)).x;
      float b=texture(pressure,uv-vec2(0,texel.y)).x;
      float t=texture(pressure,uv+vec2(0,texel.y)).x;
      frag=vec4((l+r+b+t-texture(divergence,uv).x)*.25,0,0,1);
    }`);
    project = program(`void main(){
      float l=texture(pressure,uv-vec2(texel.x,0)).x;
      float r=texture(pressure,uv+vec2(texel.x,0)).x;
      float b=texture(pressure,uv-vec2(0,texel.y)).x;
      float t=texture(pressure,uv+vec2(0,texel.y)).x;
      frag=vec4(texture(velocity,uv).xy-vec2(r-l,t-b)*.5,0,1);
    }`);
    display = program(`void main(){
      vec3 ink=max(sampleLinear(source,uv).rgb,vec3(0));
      float strength=max(ink.r,max(ink.g,ink.b));
      // Muted pastel ink: preserve the changing hues without neon saturation.
      vec3 rgb=mix(ink/max(strength,.001),vec3(.78),.48);
      float alpha=(1.-exp(-strength*1.3))*.36;
      frag=vec4(rgb*alpha,alpha);
    }`);
  } catch (error) {
    programs.forEach(p=>gl.deleteProgram(p)); canvas.remove();
    console.warn('Fluid cursor unavailable:', error); return;
  }
  const buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  let targets=[];
  function target(w,h) {
    const texture=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA16F,w,h,0,gl.RGBA,gl.HALF_FLOAT,null);
    const fbo=gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
    targets.push({texture,fbo,w,h});
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE) throw Error('Fluid framebuffer unavailable');
    gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
    return targets[targets.length-1];
  }
  function pair(w,h) {return {read:target(w,h),write:target(w,h),swap(){[this.read,this.write]=[this.write,this.read];}};}
  function disposeTargets(){targets.forEach(t=>{gl.deleteTexture(t.texture);gl.deleteFramebuffer(t.fbo);});targets=[];}
  let velocity, dye, pressure, divergence, curl, width, height;
  function resize(){
    width=innerWidth; height=innerHeight;
    const dpr=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*dpr); canvas.height=Math.round(height*dpr);
    disposeTargets();
    const ratio=width/height;
    const size=n=>ratio>=1?[Math.round(n*ratio),n]:[n,Math.round(n/ratio)];
    velocity=pair(...size(128)); dye=pair(...size(384)); pressure=pair(...size(128));
    divergence=target(...size(128)); curl=target(...size(128));
  }
  function pass(p, output, textures={}, values={}){
    gl.useProgram(p.p); let unit=0;
    for(const [name,t] of Object.entries(textures)){
      gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t.texture);
      gl.uniform1i(p.uniforms[name],unit++);
    }
    for(const [name,value] of Object.entries(values)){
      const location=p.uniforms[name]; if(location===undefined)continue;
      if(Array.isArray(value))gl['uniform'+value.length+'fv'](location,value);
      else gl.uniform1f(location,value);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER,output?output.fbo:null);
    gl.viewport(0,0,output?output.w:canvas.width,output?output.h:canvas.height);
    gl.drawArrays(gl.TRIANGLES,0,6);
  }
  let raf=0, previous=0, activeUntil=0, lastPointer=null, hue=0, ready=true;
  const pending=[];
  const enabled=()=>ready&&fine.matches&&!reduced.matches&&!document.hidden;
  function stop(){
    cancelAnimationFrame(raf);raf=0;lastPointer=null;pending.length=0;
    document.documentElement.classList.remove('has-liquid-cursor');
    layer.classList.remove('is-visible');
  }
  function fail(error){ready=false;stop();canvas.remove();disposeTargets();programs.forEach(p=>gl.deleteProgram(p));gl.deleteBuffer(buffer);console.warn('Fluid cursor stopped:',error);}
  try{resize();}catch(error){fail(error);return;}
  function palette(h){
    return [0,2/3,1/3].map(offset=>Math.max(0,Math.min(1,Math.abs(((h+offset)%1)*6-3)-1)));
  }
  function splat(s){
    // Broader injection footprint gives the fluid head a softer, fuller shape.
    const values={point:[s.x/width,1-s.y/height],aspect:width/height,radius:.0014};
    pass(inject,velocity.write,{source:velocity.read},{...values,color:[s.dx/width*velocity.read.w*7,-s.dy/height*velocity.read.h*7,0]});velocity.swap();
    pass(inject,dye.write,{source:dye.read},{...values,color:s.color});dye.swap();
  }
  function render(now){
    raf=0;if(!enabled()){stop();return;}
    const dt=Math.min((now-previous)/1000,1/30);previous=now;
    const texel=[1/velocity.read.w,1/velocity.read.h];
    pass(advect,velocity.write,{source:velocity.read,velocity:velocity.read},{texel,dt,decay:1.2});velocity.swap();
    pending.splice(0).forEach(splat);
    pass(curlPass,curl,{velocity:velocity.read},{texel});
    pass(swirl,velocity.write,{velocity:velocity.read,curl},{texel,dt});velocity.swap();
    pass(divergencePass,divergence,{velocity:velocity.read},{texel});
    gl.bindFramebuffer(gl.FRAMEBUFFER,pressure.read.fbo);gl.clear(gl.COLOR_BUFFER_BIT);
    for(let i=0;i<18;i++){pass(pressurePass,pressure.write,{pressure:pressure.read,divergence},{texel});pressure.swap();}
    pass(project,velocity.write,{velocity:velocity.read,pressure:pressure.read},{texel});velocity.swap();
    pass(advect,dye.write,{source:dye.read,velocity:velocity.read},{texel,dt,decay:1.05});dye.swap();
    pass(display,null,{source:dye.read});
    if(now<activeUntil)raf=requestAnimationFrame(render);
    else {gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.clear(gl.COLOR_BUFFER_BIT);}
  }
  function move(event){
    if(event.pointerType==='touch'||!enabled()||gl.isContextLost())return;
    const x=event.clientX,y=event.clientY,now=performance.now();
    layer.classList.add('is-visible');
    document.documentElement.classList.add('has-liquid-cursor');
    if(lastPointer){
      const dx=x-lastPointer.x,dy=y-lastPointer.y,distance=Math.hypot(dx,dy);
      const steps=Math.min(12,Math.max(1,Math.ceil(distance/10)));
      for(let i=1;i<=steps;i++){
        hue=(hue+.012)%1;
        pending.push({x:lastPointer.x+dx*i/steps,y:lastPointer.y+dy*i/steps,dx:dx/steps,dy:dy/steps,color:palette(hue)});
      }
      if(pending.length>48)pending.splice(0,pending.length-48);
    }
    lastPointer={x,y};activeUntil=now+6000;
    if(!raf){previous=now-16;raf=requestAnimationFrame(render);}
  }
  document.addEventListener('pointermove',move,{passive:true});
  document.addEventListener('mouseleave',()=>{lastPointer=null;document.documentElement.classList.remove('has-liquid-cursor');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  window.addEventListener('blur',stop);
  fine.addEventListener('change',stop);reduced.addEventListener('change',stop);
  window.addEventListener('resize',()=>{stop();try{resize();}catch(error){fail(error);}});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();stop();});
});
