const steps=[...document.querySelectorAll('.quiz-step')];
const buttons=[...document.querySelectorAll('.next')];
const progress=document.getElementById('progress');
let i=0;
function goNext(){
  steps[i].classList.remove('active');
  i++;
  if(i<steps.length){steps[i].classList.add('active');progress.style.width=(i/(steps.length-1))*100+'%';}
}
buttons.forEach(b=>b.addEventListener('click',goNext));
steps[0].classList.add('active');