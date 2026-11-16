export const preferenceKey = "clearmind.accessibility.v1";

export const accessibilityBootstrap = `try{const p=JSON.parse(localStorage.getItem("${preferenceKey}")||"{}");const e=document.documentElement;if(["normal","large","extra"].includes(p.size))e.dataset.textSize=p.size;if(p.contrast===true)e.dataset.contrast="high";}catch{}`;
