let drugs = [];

function loadDrugs() {
  const json = localStorage.getItem('drugs');
  if (json) {
    try { drugs = JSON.parse(json); } catch (e) { console.error(e); }
  }
}

function saveDrugs() {
  localStorage.setItem('drugs', JSON.stringify(drugs));
}

function addDrug(drug) {
  drugs.push(drug);
  saveDrugs();
  populateDrugSelect();
  renderDrugTable();
}

function deleteDrug(index) {
  drugs.splice(index,1);
  saveDrugs();
  populateDrugSelect();
  renderDrugTable();
}

function populateDrugSelect() {
  const select = document.getElementById('drugSelect');
  select.innerHTML = '';
  drugs.forEach(d => {
    const opt = document.createElement('option');
    opt.value = d.name;
    opt.textContent = d.name;
    select.appendChild(opt);
  });
}

function renderDrugTable(sortKey) {
  let list = [...drugs];
  const search = document.getElementById('searchBox').value || '';
  if (search) {
    list = list.filter(d => d.name.includes(search));
  }
  if (sortKey) {
    list.sort((a,b)=> (a[sortKey]||'').toString().localeCompare((b[sortKey]||'')));
  }
  const tbody = document.querySelector('#drugTable tbody');
  tbody.innerHTML = '';
  list.forEach((d,i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${d.name}</td><td>${d.category||''}</td><td>${d.usage||''}</td><td>${d.frequency||''}</td><td>${d.adult_dose}</td>`;
    const del = document.createElement('button');
    del.textContent = '削除';
    del.onclick = ()=>deleteDrug(i);
    const tdDel = document.createElement('td');
    tdDel.appendChild(del);
    tr.appendChild(tdDel);
    tbody.appendChild(tr);
  });
}

function parseAge(str) {
  if (str === '-' || !str) return -1;
  const m = str.match(/(\d+)y(\d+)m/);
  if (!m) return -1;
  return parseInt(m[1])*12 + parseInt(m[2]);
}

function determineField(y,m){
  if (y===0 && m < 6) return 'dose_lt_6m';
  if (y===0 && m >=6) return 'dose_6m_lt_1y';
  if (y>=1 && y<3) return 'dose_1y_lt_3y';
  if (y>=3 && y<8) return 'dose_3y_lt_8y';
  if (y>=8 && y<12) return 'dose_8y_lt_12y';
  return 'dose_12y_lt_adult';
}

function calculate(){
  const y = parseInt(document.getElementById('ageYears').value)||0;
  const m = parseInt(document.getElementById('ageMonths').value)||0;
  const weight = parseFloat(document.getElementById('weight').value);
  if (!weight || weight<=0){ alert('体重は正の数を入力してください'); return; }
  const drugName = document.getElementById('drugSelect').value;
  const drug = drugs.find(d=>d.name===drugName);
  if(!drug){ alert('薬剤を選択してください'); return; }
  const childMonths = y*12+m;
  const minMonths = parseAge(drug.min_age);
  if(minMonths>=0 && childMonths<minMonths){
    document.getElementById('result').textContent=`投与不可 (最低年齢 ${drug.min_age})`;
    return;
  }
  const field = determineField(y,m);
  const perKg = drug[field];
  if(perKg==='-'){
    document.getElementById('result').textContent='投与不可';
    return;
  }
  const dose = weight * parseFloat(perKg);
  let resultDose = dose;
  let note = '';
  if(dose>drug.adult_dose){
    resultDose = drug.adult_dose;
    note = '(成人量)';
  }
  document.getElementById('result').textContent=`${drug.name} ${drug.category||''} ${resultDose}mg${note} ${drug.frequency||''}`;
}

function init(){
  loadDrugs();
  if(drugs.length===0){
    addDrug({name:'サンプル薬',category:'解熱鎮痛薬',usage:'内服',frequency:'分4',adult_dose:4000,dose_lt_6m:'-',dose_6m_lt_1y:10,dose_1y_lt_3y:25,dose_3y_lt_8y:35,dose_8y_lt_12y:50,dose_12y_lt_adult:60,min_age:'-'});
  } else {
    populateDrugSelect();
    renderDrugTable();
  }
  document.getElementById('calcBtn').onclick=calculate;
  document.getElementById('openManager').onclick=()=>{document.getElementById('drugModal').style.display='block';renderDrugTable();};
  document.getElementById('closeManager').onclick=()=>{document.getElementById('drugModal').style.display='none';};
  document.getElementById('addDrug').onclick=()=>{
    const d={
      name:document.getElementById('drugName').value,
      category:document.getElementById('drugCategory').value,
      usage:document.getElementById('drugUsage').value,
      frequency:document.getElementById('drugFrequency').value,
      adult_dose:parseFloat(document.getElementById('adultDose').value),
      dose_lt_6m:document.getElementById('dose_lt_6m').value,
      dose_6m_lt_1y:document.getElementById('dose_6m_lt_1y').value,
      dose_1y_lt_3y:document.getElementById('dose_1y_lt_3y').value,
      dose_3y_lt_8y:document.getElementById('dose_3y_lt_8y').value,
      dose_8y_lt_12y:document.getElementById('dose_8y_lt_12y').value,
      dose_12y_lt_adult:document.getElementById('dose_12y_lt_adult').value,
      min_age:document.getElementById('minAge').value||'-'
    };
    if(!d.name||!d.adult_dose){ alert('薬剤名と成人量は必須です'); return; }
    addDrug(d);
  };
  document.getElementById('searchBox').oninput=()=>renderDrugTable();
  document.querySelectorAll('#drugTable th[data-sort]').forEach(th=>{
    th.onclick=()=>renderDrugTable(th.getAttribute('data-sort'));});
}

document.addEventListener('DOMContentLoaded',init);
