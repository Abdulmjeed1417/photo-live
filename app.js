const $ = s=>document.querySelector(s);
const canvas = $("#canvas"); const ctx = canvas.getContext("2d");

let state = {
  size:1080,
  grad:{c1:"#0f6f73", c2:"#0b4e50", angle:25},
  bgImage:null, bgImageOpacity:0.25, bgFit:"cover", bgBlur:0, bgBright:1, bgContrast:1,

  // Logos (v5 baseline with fixed top-right position at 10px)
  wmLogo:null, wmEnabled:true, wmOpacity:0.08, wmScale:1.4,
  topLogo:null, topEnabled:true, topScale:0.23, topRotation:0, topOpacity:1, topFlipH:false, topFlipV:false,

  // Text & decor
  quote:"وقتك رأسُ مالك؛ إن أضعته اليوم أضعتَ غدَك.",
  fontSize:72, lineHeight:1.35, textColor:"#ffffff", textShadow:true, textAlign:"center",
  showQuotes:true, showLine:true, showBadge:false, accentColor:"#CBA552", accentAlpha:1, sepColor:"#CBA552", sepAlpha:1, sepSize:64, sepYOffset:0,
  lineLabel:{text:"", bg:"#063033", color:"#ffffff", radius:18},

  // Overlay movable image
  overlay:{img:null, opacity:1, scale:1, rotation:0, xPerc:50, yPerc:50, visible:true, flipH:false, flipV:false, bright:1, contrast:1, saturate:1}
};

function setSize(n){ state.size=n; canvas.width=n; canvas.height=n; draw(); }
function deg2rad(d){ return d*Math.PI/180; }

function drawGradient(){
  const ang = deg2rad(state.grad.angle);
  const r = canvas.width/2;
  const x = Math.cos(ang)*r, y = Math.sin(ang)*r;
  const g = ctx.createLinearGradient(canvas.width/2-x, canvas.height/2-y, canvas.width/2+x, canvas.height/2+y);
  g.addColorStop(0, state.grad.c1); g.addColorStop(1, state.grad.c2);
  ctx.fillStyle = g; ctx.fillRect(0,0,canvas.width,canvas.height);
}
function drawBackgroundImage(){
  if(!state.bgImage) return;
  ctx.save();
  if("filter" in ctx){
    ctx.filter = `blur(${state.bgBlur}px) brightness(${state.bgBright}) contrast(${state.bgContrast})`;
  } else {
    ctx.filter = `blur(${state.bgBlur}px)`;
  }
  ctx.globalAlpha = state.bgImageOpacity;
  const img = state.bgImage, cw=canvas.width, ch=canvas.height;
  const ir = img.width/img.height, cr=cw/ch;
  let w,h,dx,dy;
  if(state.bgFit==="cover"){
    if(ir>cr){ h=ch; w=h*ir; dx=(cw-w)/2; dy=0; } else { w=cw; h=w/ir; dx=0; dy=(ch-h)/2; }
  }else{
    if(ir>cr){ w=cw; h=w/ir; dx=0; dy=(ch-h)/2; } else { h=ch; w=h*ir; dx=(cw-w)/2; dy=0; }
  }
  ctx.drawImage(img, dx, dy, w, h);
  ctx.filter="none"; ctx.restore();
}
  ctx.globalAlpha = state.bgImageOpacity;
  const img = state.bgImage, cw=canvas.width, ch=canvas.height;
  const ir = img.width/img.height, cr=cw/ch;
  let w,h,dx,dy;
  if(state.bgFit==="cover"){
    if(ir>cr){ h=ch; w=h*ir; dx=(cw-w)/2; dy=0; } else { w=cw; h=w/ir; dx=0; dy=(ch-h)/2; }
  }else{
    if(ir>cr){ w=cw; h=w/ir; dx=0; dy=(ch-h)/2; } else { h=ch; w=h*ir; dx=(cw-w)/2; dy=0; }
  }
  ctx.drawImage(img, dx, dy, w, h);
  ctx.filter="none"; ctx.restore();
}
function drawLogoWatermark(){
  if(!state.wmEnabled || !state.wmLogo) return;
  const img = state.wmLogo;
  const target = Math.min(canvas.width, canvas.height)*state.wmScale;
  const ir = img.width/img.height;
  let w,h; if(ir>=1){ w=target; h=target/ir; } else { h=target; w=h*ir; }
  const x = canvas.width/2 - w/2, y = canvas.height/2 - h/2;
  ctx.save(); ctx.globalAlpha = state.wmOpacity; ctx.drawImage(img, x, y, w, h); ctx.restore();
}
function drawOverlay(){
  const o = state.overlay; if(!o.visible || !o.img) return;
  const img=o.img; const cx = canvas.width*(o.xPerc/100), cy = canvas.height*(o.yPerc/100);
  const base = Math.min(canvas.width, canvas.height)*0.5*o.scale; const ir=img.width/img.height;
  let w,h; if(ir>=1){ w=base; h=base/ir; } else { h=base; w=h*ir; }
  ctx.save(); ctx.globalAlpha=o.opacity; ctx.translate(cx,cy); ctx.rotate(deg2rad(o.rotation));
  ctx.scale(o.flipH?-1:1, o.flipV?-1:1);
  if("filter" in ctx){ ctx.filter = `brightness(${o.bright}) contrast(${o.contrast}) saturate(${o.saturate})`; }
  ctx.drawImage(img, -w/2, -h/2, w, h); ctx.filter="none"; ctx.restore();
}
function wrapText(text, maxW){
  const words = text.split(/\s+/); const lines=[]; let line="";
  ctx.font = `900 ${state.fontSize}px Tajawal, system-ui`;
  for(const word of words){
    const test = (line?line+" ":"")+word;
    if(ctx.measureText(test).width <= maxW){ line=test; }
    else{ if(line) lines.push(line); line=word; }
  }
  if(line) lines.push(line); return lines;
}
function drawDecor(){
  const pad = canvas.width*0.09, color = hexWithAlpha(state.accentColor, state.accentAlpha);
  ctx.save(); ctx.fillStyle=color; ctx.strokeStyle=color;
  if(state.showLine){ ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(pad, canvas.height*0.85); ctx.lineTo(canvas.width-pad, canvas.height*0.85); ctx.stroke(); }

  // الفواصل أعلى النص
  if(state.showQuotes){
    const size = state.sepSize;
    ctx.fillStyle = hexWithAlpha(state.sepColor, state.sepAlpha);
    ctx.textAlign="center"; ctx.textBaseline="alphabetic";
    ctx.font=`900 ${size}px Tajawal`;
    const baseY = canvas.height*0.32 + state.sepYOffset;
    ctx.fillText("“", canvas.width/2, baseY);
    ctx.fillText("”", canvas.width/2, baseY + size*0.9);
  }

  if(state.showBadge){ ctx.globalAlpha*=0.92; ctx.beginPath(); ctx.arc(canvas.width*0.12, canvas.height*0.18, canvas.width*0.035, 0, Math.PI*2); ctx.fill(); }
  ctx.restore();
}
  if(state.showLine){ ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(pad, canvas.height*0.85); ctx.lineTo(canvas.width-pad, canvas.height*0.85); ctx.stroke(); }
  if(state.showBadge){ ctx.globalAlpha*=0.92; ctx.beginPath(); ctx.arc(canvas.width*0.12, canvas.height*0.18, canvas.width*0.035, 0, Math.PI*2); ctx.fill(); }
  ctx.restore();
}
function drawText(){
  const maxW = canvas.width*0.76; ctx.save(); ctx.fillStyle=state.textColor; ctx.textBaseline="top";
  if(state.textShadow){ ctx.shadowColor="rgba(0,0,0,.35)"; ctx.shadowBlur=10; ctx.shadowOffsetY=3; }
  let x = canvas.width/2; let align="center";
  if(state.textAlign==="right"){ align="right"; x=canvas.width*0.86; }
  else if(state.textAlign==="left"){ align="left"; x=canvas.width*0.14; }
  ctx.textAlign=align; ctx.font=`900 ${state.fontSize}px Tajawal, system-ui`;
  const lines = wrapText(state.quote, maxW); const totalH = lines.length*state.fontSize*state.lineHeight;
  const startY = (canvas.height - totalH)/2; const lineSpacing = state.fontSize*(state.lineHeight-1);
  lines.forEach((ln,i)=> ctx.fillText(ln, x, startY + i*(state.fontSize+lineSpacing)));
  if(state.showQuotes){
    ctx.shadowColor="transparent"; ctx.fillStyle = hexWithAlpha(state.accentColor, state.accentAlpha);
    ctx.textAlign="center"; ctx.font=`900 ${Math.round(state.fontSize*0.9)}px Tajawal`;
    const y = startY + lines.length*(state.fontSize+lineSpacing) - lineSpacing*0.3;
    ctx.fillText("”", canvas.width/2, y+state.fontSize*0.2);
  }
  ctx.restore();
}
function drawLineLabel(){
  if(!state.showLine) return;
  const t = state.lineLabel.text; if(!t) return;
  const y = canvas.height*0.85; ctx.save();
  ctx.font = `800 ${Math.round(state.fontSize*0.45)}px Tajawal`;
  const paddingX=18, paddingY=8; const textW = ctx.measureText(t).width;
  const boxW = textW + paddingX*2, boxH = state.fontSize*0.45 + paddingY*2;
  const x = (canvas.width - boxW)/2, r = state.lineLabel.radius;
  ctx.fillStyle = hexWithAlpha(state.lineLabel.bg, 0.96); roundRect(ctx, x, y-boxH/2, boxW, boxH, r); ctx.fill();
  ctx.fillStyle = state.lineLabel.color; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(t, canvas.width/2, y);
  ctx.restore();
}
function roundRect(ctx,x,y,w,h,r){ r=Math.min(r,w/2,h/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function hexWithAlpha(hex, a=1){ let h=hex.replace("#",""); if(h.length===3) h=h.split("").map(c=>c+c).join(""); const r=parseInt(h.slice(0,2),16), g=parseInt(h.slice(2,4),16), b=parseInt(h.slice(4,6),16); return `rgba(${r},${g},${b},${a})`; }

function drawTopRightLogo(){
  if(!state.topEnabled || !state.topLogo) return;
  const img = state.topLogo;
  const target = canvas.width * state.topScale;
  const ir = img.width/img.height;
  let w,h; if(ir>=1){ w=target; h=target/ir; } else { h=target; w=h*ir; }

  ctx.save();
  ctx.globalAlpha = state.topOpacity;

  // ثابت: 10px من الأعلى واليمين
  const offsetX = 10, offsetY = 10;
  ctx.translate(canvas.width - offsetX, offsetY);
  ctx.rotate(deg2rad(state.topRotation));
  ctx.scale(state.topFlipH?-1:1, state.topFlipV?-1:1);
  // ثبت الركن العلوي الأيمن
  ctx.drawImage(img, -w, 0, w, h);
  ctx.restore();
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawGradient();
  drawBackgroundImage();
  drawLogoWatermark();
  drawOverlay();
  drawText();
  drawLineLabel();
  drawTopRightLogo();
}

function hookUI(){
  $("#canvasSize").addEventListener("change", e=> setSize(parseInt(e.target.value)));
  $("#bg1").addEventListener("input", e=>{state.grad.c1=e.target.value; draw();});
  $("#bg2").addEventListener("input", e=>{state.grad.c2=e.target.value; draw();});
  $("#gradAngle").addEventListener("input", e=>{state.grad.angle=parseInt(e.target.value); draw();});
  $("#bgImage").addEventListener("change", e=>{ const f=e.target.files[0]; if(!f) return; const img=new Image(); img.onload=()=>{state.bgImage=img; draw();}; img.src=URL.createObjectURL(f); });
  $("#bgImageOpacity").addEventListener("input", e=>{state.bgImageOpacity=parseFloat(e.target.value); draw();});
  $("#bgBlur").addEventListener("input", e=>{state.bgBlur=parseFloat(e.target.value); draw();});
  $("#bgFit").addEventListener("change", e=>{state.bgFit=e.target.value; draw();});
  $("#bgBright").addEventListener("input", e=>{state.bgBright=parseFloat(e.target.value); draw();});
  $("#bgContrast").addEventListener("input", e=>{state.bgContrast=parseFloat(e.target.value); draw();});

  // watermark logo
  $("#wmLogo").addEventListener("change", e=>{ const f=e.target.files[0]; if(!f) return; const img=new Image(); img.onload=()=>{state.wmLogo=img; draw();}; img.src=URL.createObjectURL(f); });
  $("#wmEnabled").addEventListener("change", e=>{state.wmEnabled=e.target.checked; draw();});
  $("#wmOpacity").addEventListener("input", e=>{state.wmOpacity=parseFloat(e.target.value); draw();});
  $("#wmScale").addEventListener("input", e=>{state.wmScale=parseFloat(e.target.value); draw();});

  // top-right fixed logo
  $("#topLogo").addEventListener("change", e=>{ const f=e.target.files[0]; if(!f) return; const img=new Image(); img.onload=()=>{state.topLogo=img; draw();}; img.src=URL.createObjectURL(f); });
  $("#topEnabled").addEventListener("change", e=>{state.topEnabled=e.target.checked; draw();});
  $("#topScale").addEventListener("input", e=>{state.topScale=parseFloat(e.target.value); draw();});
  $("#topRotation").addEventListener("input", e=>{state.topRotation=parseFloat(e.target.value); draw();});
  $("#topOpacity").addEventListener("input", e=>{state.topOpacity=parseFloat(e.target.value); draw();});
  $("#topFlipH").addEventListener("change", e=>{state.topFlipH=e.target.checked; draw();});
  $("#topFlipV").addEventListener("change", e=>{state.topFlipV=e.target.checked; draw();});

  // text
  $("#quote").addEventListener("input", e=>{state.quote=e.target.value; draw();});
  $("#fontSize").addEventListener("input", e=>{state.fontSize=parseInt(e.target.value); draw();});
  $("#lineHeight").addEventListener("input", e=>{state.lineHeight=parseFloat(e.target.value); draw();});
  $("#textColor").addEventListener("input", e=>{state.textColor=e.target.value; draw();});
  $("#textShadow").addEventListener("change", e=>{state.textShadow=e.target.checked; draw();});
  $("#textAlign").addEventListener("change", e=>{state.textAlign=e.target.value; draw();});
  $("#showQuotes").addEventListener("change", e=>{state.showQuotes=e.target.checked; draw();});
  $("#showLine").addEventListener("change", e=>{state.showLine=e.target.checked; draw();});
  $("#showBadge").addEventListener("change", e=>{state.showBadge=e.target.checked; draw();});
  $("#accentColor").addEventListener("input", e=>{state.accentColor=e.target.value; draw();});
  $("#accentAlpha").addEventListener("input", e=>{state.accentAlpha=parseFloat(e.target.value); draw();});
  $("#sepColor").addEventListener("input", e=>{state.sepColor=e.target.value; draw();});
  $("#sepAlpha").addEventListener("input", e=>{state.sepAlpha=parseFloat(e.target.value); draw();});
  $("#sepSize").addEventListener("input", e=>{state.sepSize=parseInt(e.target.value); draw();});
  $("#sepYOffset").addEventListener("input", e=>{state.sepYOffset=parseInt(e.target.value); draw();});
  $("#lineLabel").addEventListener("input", e=>{state.lineLabel.text=e.target.value; draw();});
  $("#lineLabelBg").addEventListener("input", e=>{state.lineLabel.bg=e.target.value; draw();});
  $("#lineLabelColor").addEventListener("input", e=>{state.lineLabel.color=e.target.value; draw();});
  $("#lineLabelRadius").addEventListener("input", e=>{state.lineLabel.radius=parseInt(e.target.value); draw();});

  // overlay
  $("#overlayImage").addEventListener("change", e=>{ const f=e.target.files[0]; if(!f) return; const img=new Image(); img.onload=()=>{state.overlay.img=img; draw();}; img.src=URL.createObjectURL(f); });
  $("#overlayOpacity").addEventListener("input", e=>{state.overlay.opacity=parseFloat(e.target.value); draw();});
  $("#overlayScale").addEventListener("input", e=>{state.overlay.scale=parseFloat(e.target.value); draw();});
  $("#overlayRotation").addEventListener("input", e=>{state.overlay.rotation=parseFloat(e.target.value); draw();});
  $("#overlayVisible").addEventListener("change", e=>{state.overlay.visible=e.target.checked; draw();});
  $("#overlayX").addEventListener("input", e=>{state.overlay.xPerc=parseFloat(e.target.value); draw();});
  $("#overlayY").addEventListener("input", e=>{state.overlay.yPerc=parseFloat(e.target.value); draw();});
  $("#overlayFlipH").addEventListener("change", e=>{state.overlay.flipH=e.target.checked; draw();});
  $("#overlayFlipV").addEventListener("change", e=>{state.overlay.flipV=e.target.checked; draw();});
  $("#overlayBright").addEventListener("input", e=>{state.overlay.bright=parseFloat(e.target.value); draw();});
  $("#overlayContrast").addEventListener("input", e=>{state.overlay.contrast=parseFloat(e.target.value); draw();});
  $("#overlaySaturate").addEventListener("input", e=>{state.overlay.saturate=parseFloat(e.target.value); draw();});

  // export & reset
  $("#btnExport").addEventListener("click", ()=>{
    const a = document.createElement("a");
    a.download = "hamidin-quote.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  });
  $("#btnReset").addEventListener("click", ()=>{
    state = {
      size:1080, grad:{c1:"#0f6f73", c2:"#0b4e50", angle:25},
      bgImage:null, bgImageOpacity:0.25, bgFit:"cover", bgBlur:0, bgBright:1, bgContrast:1,
      wmLogo:null, wmEnabled:true, wmOpacity:0.08, wmScale:1.4,
      topLogo:null, topEnabled:true, topScale:0.23, topRotation:0, topOpacity:1, topFlipH:false, topFlipV:false,
      quote:"وقتك رأسُ مالك؛ إن أضعته اليوم أضعتَ غدَك.", fontSize:72, lineHeight:1.35, textColor:"#ffffff", textShadow:true, textAlign:"center",
      showQuotes:true, showLine:true, showBadge:false, accentColor:"#CBA552", accentAlpha:1, sepColor:"#CBA552", sepAlpha:1, sepSize:64, sepYOffset:0, lineLabel:{text:\"\", bg:\"#063033\", color:\"#ffffff\", radius:18},
      overlay:{img:null, opacity:1, scale:1, rotation:0, xPerc:50, yPerc:50, visible:true, flipH:false, flipV:false, bright:1, contrast:1, saturate:1}
    };
    $('#canvasSize').value='1080'; $('#bg1').value='#0f6f73'; $('#bg2').value='#0b4e50'; $('#gradAngle').value=25;
    $('#bgImage').value=''; $('#bgImageOpacity').value=0.25; $('#bgBlur').value=0; $('#bgFit').value='cover';
    $('#wmLogo').value=''; $('#wmEnabled').checked=true; $('#wmOpacity').value=0.08; $('#wmScale').value=1.4;
    $('#topLogo').value=''; $('#topEnabled').checked=true; $('#topScale').value=0.23; $('#topRotation').value=0; $('#topOpacity').value=1; $('#topFlipH').checked=false; $('#topFlipV').checked=false;
    $('#quote').value=state.quote; $('#fontSize').value=72; $('#lineHeight').value=1.35; $('#textColor').value='#ffffff'; $('#textShadow').checked=true; $('#textAlign').value='center';
    $('#showQuotes').checked=true; $('#showLine').checked=true; $('#showBadge').checked=false; $('#accentColor').value='#CBA552'; $('#accentAlpha').value=1;
    $('#lineLabel').value=''; $('#lineLabelBg').value='#063033'; $('#lineLabelColor').value='#ffffff'; $('#lineLabelRadius').value=18;
    $('#overlayImage').value=''; $('#overlayOpacity').value=1; $('#overlayScale').value=1; $('#overlayRotation').value=0; $('#overlayVisible').checked=true; $('#overlayX').value=50; $('#overlayY').value=50; $('#overlayFlipH').checked=false; $('#overlayFlipV').checked=false; $('#overlayBright').value=1; $('#overlayContrast').value=1; $('#overlaySaturate').value=1;
    setSize(1280);
  });
}
hookUI(); setSize(1280); draw();
