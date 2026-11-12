/* Only the presentation shell scales. The app always uses one 390 × 844 screen. */
(() => {
  const viewport=document.getElementById('preview-viewport');
  const holder=document.getElementById('preview-holder');
  const device=holder.querySelector('.device-wrap');
  const output=document.getElementById('preview-scale');
  let mode='fit',scale=1;
  function update(){
    if(mode==='fit')scale=Math.min((viewport.clientWidth-36)/410,(viewport.clientHeight-36)/864,1);
    scale=Math.max(.25,Math.min(1.5,scale));
    holder.style.width=`${410*scale}px`;
    holder.style.height=`${864*scale}px`;
    device.style.transform=`scale(${scale})`;
    output.value=`${Math.round(scale*100)}%`;
    document.querySelector('[data-preview="fit"]').classList.toggle('active',mode==='fit');
  }
  document.querySelectorAll('[data-preview]').forEach(button=>button.addEventListener('click',()=>{
    const action=button.dataset.preview;
    if(action==='fit')mode='fit';
    else{mode='manual';scale+=action==='in'?.1:-.1;}
    update();
  }));
  new ResizeObserver(update).observe(viewport);
  update();
})();
