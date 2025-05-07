import TextRecognition, { TextRecognitionScript } from '@react-native-ml-kit/text-recognition';

const excludedBrands = [
  '해태제과','오리온','크라운제과','농심','롯데제과','삼양식품','빙그레','포카칩','롯데푸드',
  '오뚜기','팔도','CJ제일제당','해찬들','대상','청정원','샘표식품','풀무원','양반','동원F&B',
  '사조대림','백설','샘표','이금기','해표','비비고','롯데칠성음료','광동제약','웅진식품',
  '동아오츠카','해태htb','코카콜라음료','델몬트','남양유업','매일유업','서울우유','푸르밀',
  '종가집','동원','롯데','해태','동원','국산'
].map((brand) => brand.toLowerCase());

export function preprocessName(name) {
  let raw = name.trim();
  if (/^[0-9]+\s*$/.test(raw)) {
    if (raw.trim().length === 1) {
      return raw.trim();
    } else {
      return '';
    }
  }
  let processed = raw;
  processed = processed.replace(/^[0-9]+\s*[a-zA-Z]/, '');
  processed = processed.replace(/^[0-9]+\s*/, '');
  processed = processed.replace(/[^가-힣0-9a-zA-Z\/\s]/g, '');
  const slashIndex = processed.indexOf('/');
  if (slashIndex !== -1) {
    processed = processed.substring(0, slashIndex);
  }
  processed = processed
    .replace(/([가-힣])([a-zA-Z0-9])/g, '$1 $2')
    .replace(/([a-zA-Z])([가-힣])/g, '$1 $2');
  processed = processed.replace(/\s+/g, ' ').trim().toLowerCase();
  excludedBrands.forEach((brand) => {
    processed = processed.replace(new RegExp(brand, 'gi'), '').trim();
  });
  return processed;
}

export async function processImage(uri) {
  const result = await TextRecognition.recognize(uri, TextRecognitionScript.KOREAN);
  if (!result?.blocks) return { groupedLines: [], normalizedLines: [], filteredItems: [], jsonData: [] };
  const lines = result.blocks.flatMap((block) =>
    block.lines.map((line) => ({
      text: line.text,
      y: line.bounding?.top ?? 0,
    }))
  ).filter((line) =>
    !/\d{10,}/.test(line.text) &&
    !/\d{1,3}[,.][^\s]{3}(?![^\s])/.test(line.text)
  );
  const grouped = [];
  lines.sort((a, b) => a.y - b.y);
  lines.forEach((line) => {
    const lastGroup = grouped[grouped.length - 1];
    if (!lastGroup || Math.abs(lastGroup[0].y - line.y) > 10) {
      grouped.push([line]);
    } else {
      lastGroup.push(line);
    }
  });
  const normalized = lines.filter((line) => /^\s*0{0,2}\d{1,2}P?\b/.test(line.text));
  const items = normalized.map((line) => line.text);
  let processed = items.map((item) => preprocessName(item)).filter(Boolean);
  const withText = processed.filter(x => /[a-zA-Z가-힣]/.test(x));
  const onlyDigits = processed.filter(x => /^[0-9]$/.test(x));
  const reordered = [...withText, ...onlyDigits];
  const jsonResult = [];
  const len = Math.min(withText.length, onlyDigits.length);
  for (let i = 0; i < len; i++) {
    let name = withText[i];
    let weight = '0';
    let unit = 'EA';
    const match = name.match(/(\d+(?:\.\d+)?)(kg|g|ml|l)/i);
    if (match) {
      weight = match[1];
      unit = match[2].toLowerCase();
      name = name.substring(0, match.index);
    } else {
      const numberIndex = name.search(/[0-9]/);
      if (numberIndex !== -1) {
        name = name.substring(0, numberIndex);
      }
    }
    jsonResult.push({
      name: name.trim(),
      weight: weight,
      unit: unit,
      count: onlyDigits[i],
    });
  }
  return {
    groupedLines: grouped,
    normalizedLines: normalized,
    filteredItems: reordered,
    jsonData: jsonResult,
  };
}
