async function loadCSV() {
  const response = await fetch('../data/medications.csv');
  const text = await response.text();
  const lines = text.trim().split(/\n/);
  const headers = lines[0].split(',');
  const drugs = lines.slice(1).map(line => {
    const cols = line.split(',');
    const obj = {};
    headers.forEach((h, i) => obj[h] = cols[i]);
    return obj;
  });
  return drugs;
}

function ageToYears(years, months) {
  return parseFloat(years || 0) + parseFloat(months || 0) / 12;
}

function determineAgeGroup(ageYears) {
  const groups = [
    { key: '0か月', limit: 0 },
    { key: '6か月', limit: 0.5 },
    { key: '1歳', limit: 1 },
    { key: '3歳', limit: 3 },
    { key: '8歳', limit: 8 },
    { key: '12歳', limit: 12 }
  ];
  let selected = groups[0];
  for (const g of groups) {
    if (ageYears >= g.limit) selected = g;
    else break;
  }
  return selected.key;
}

function calculateDose(drug, ageYears, weightKg) {
  const ageGroup = determineAgeGroup(ageYears);
  const minKey = ageGroup + '最小量';
  const maxKey = ageGroup + '最大量';
  const minMgKg = parseFloat(drug[minKey]);
  const maxMgKg = parseFloat(drug[maxKey]);
  let minMg = weightKg * minMgKg;
  let maxMg = weightKg * maxMgKg;
  const adultMin = parseFloat(drug['成人最小量']);
  const adultMax = parseFloat(drug['成人最大量']);
  if (maxMg > adultMax) {
    minMg = adultMin;
    maxMg = adultMax;
  }
  return {
    route: drug['投与経路'],
    times: drug['投与回数'],
    ageGroup,
    minMgKg,
    maxMgKg,
    minMg,
    maxMg
  };
}

loadCSV().then(drugs => {
  const select = document.getElementById('drug');
  drugs.forEach(d => {
    const option = document.createElement('option');
    option.value = d['薬剤名'];
    option.textContent = d['薬剤名'];
    select.appendChild(option);
  });

  document.getElementById('dose-form').addEventListener('submit', e => {
    e.preventDefault();
    const drugName = select.value;
    const drug = drugs.find(d => d['薬剤名'] === drugName);
    const ageYears = ageToYears(
      document.getElementById('age-years').value,
      document.getElementById('age-months').value
    );
    const weight = parseFloat(document.getElementById('weight').value);
    if (!drug || isNaN(ageYears) || isNaN(weight)) return;
    const result = calculateDose(drug, ageYears, weight);
    document.getElementById('result').innerHTML =
      `<p>${drugName} (${result.route}, ${result.times})</p>` +
      `<p>対象年齢区分: ${result.ageGroup}</p>` +
      `<p>投与量: ${result.minMg.toFixed(1)}mg - ${result.maxMg.toFixed(1)}mg` +
      ` (${result.minMgKg}-${result.maxMgKg} mg/kg)</p>`;
  });
});
