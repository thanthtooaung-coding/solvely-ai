import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from '../lib/env.js';
import { generateHttpNarration } from '../lib/extra-voices.js';

const TEXT = `ခေါင်းစဉ် – နည်းပညာခေတ်တွင် လူငယ်များ၏ အနာဂတ်နှင့် အောင်မြင်မှု

ယနေ့ခေတ်သည် နည်းပညာများ အလွန်လျင်မြန်စွာ တိုးတက်ပြောင်းလဲနေသော ခေတ်တစ်ခေတ်ဖြစ်သည်။ အင်တာနက်၊ Artificial Intelligence (AI)၊ Cloud Computing နှင့် Digital Technology များသည် လူတို့၏ နေ့စဉ်ဘဝ၊ ပညာရေး၊ စီးပွားရေးနှင့် အလုပ်အကိုင်အခွင့်အလမ်းများကို များစွာပြောင်းလဲစေခဲ့သည်။ ယခင်က အချိန်များစွာယူခဲ့ရသော အလုပ်များကို ယခုအခါ နည်းပညာအသုံးပြု၍ အချိန်တိုအတွင်း လုပ်ဆောင်နိုင်လာပြီဖြစ်သည်။ ထို့ကြောင့် နည်းပညာကို နားလည်အသုံးချနိုင်ခြင်းသည် ယနေ့ခေတ်လူငယ်များအတွက် အရေးကြီးသော အရည်အချင်းတစ်ခု ဖြစ်လာသည်။

လူငယ်တစ်ဦး၏ အနာဂတ်အောင်မြင်မှုသည် ပညာရေးတစ်ခုတည်းအပေါ်တွင်သာ မူတည်နေခြင်းမဟုတ်ပါ။ မိမိကိုယ်ကို အမြဲတမ်းလေ့လာသင်ယူနိုင်ခြင်း၊ ပြဿနာများကို ဖြေရှင်းနိုင်ခြင်း၊ အခြားသူများနှင့် ပူးပေါင်းလုပ်ဆောင်နိုင်ခြင်းနှင့် အခက်အခဲများကို ရင်ဆိုင်နိုင်ခြင်းတို့လည်း အရေးကြီးသည်။ အထူးသဖြင့် နည်းပညာနယ်ပယ်တွင် လုပ်ကိုင်နေသူများအတွက် အသစ်ထွက်ပေါ်လာသော နည်းပညာများကို အမြဲလေ့လာနေရန် လိုအပ်သည်။ ယနေ့အသုံးပြုနေသော နည်းပညာတစ်ခုသည် မနက်ဖြန်တွင် ခေတ်နောက်ကျသွားနိုင်သောကြောင့် မိမိ၏ အသိပညာနှင့် ကျွမ်းကျင်မှုများကို အမြဲတိုးတက်အောင် လုပ်ဆောင်သင့်သည်။

Artificial Intelligence သည် လက်ရှိကမ္ဘာတွင် အရေးပါဆုံး နည်းပညာတစ်ခုအဖြစ် ပေါ်ထွက်လာသည်။ AI ကို အသုံးပြုခြင်းဖြင့် စာရေးသားခြင်း၊ ဘာသာပြန်ခြင်း၊ အချက်အလက်ရှာဖွေခြင်း၊ Software Development နှင့် Data Analysis ကဲ့သို့သော အလုပ်များကို ပိုမိုလွယ်ကူစွာ လုပ်ဆောင်နိုင်သည်။ သို့သော် AI ကို အသုံးပြုနိုင်ခြင်းတစ်ခုတည်းဖြင့် မလုံလောက်ပါ။ AI မှ ပေးသောအဖြေများကို မှန်ကန်မှုရှိမရှိ စစ်ဆေးနိုင်ခြင်း၊ မိမိ၏ စဉ်းစားတွေးခေါ်နိုင်စွမ်းကို အသုံးပြုနိုင်ခြင်းနှင့် သင့်လျော်သော ဆုံးဖြတ်ချက်များ ချမှတ်နိုင်ခြင်းတို့လည်း လိုအပ်သည်။

နည်းပညာတိုးတက်လာသည်နှင့်အမျှ အလုပ်အကိုင်အခွင့်အလမ်းများလည်း ပြောင်းလဲလာသည်။ ယခင်က ရုံးတစ်ရုံးတွင် ကိုယ်တိုင်သွားရောက်လုပ်ကိုင်ရန် လိုအပ်ခဲ့သော်လည်း ယခုအခါ Remote Working စနစ်ဖြင့် ကမ္ဘာ့နိုင်ငံအသီးသီးရှိ ကုမ္ပဏီများတွင် အလုပ်လုပ်ကိုင်နိုင်ပြီဖြစ်သည်။ Software Developer၊ Data Analyst၊ Cybersecurity Specialist နှင့် Cloud Engineer ကဲ့သို့သော အလုပ်အကိုင်များသည် နိုင်ငံတကာတွင် အခွင့်အလမ်းများစွာရှိသော နယ်ပယ်များဖြစ်လာသည်။ ထို့ကြောင့် လူငယ်များအနေဖြင့် မိမိတို့၏ စိတ်ဝင်စားမှုနှင့် ကိုက်ညီသော နယ်ပယ်တစ်ခုကို ရွေးချယ်ပြီး စနစ်တကျလေ့လာသင့်သည်။

အောင်မြင်မှုရရှိရန် အချိန်နှင့် ကြိုးစားအားထုတ်မှုများ လိုအပ်သည်။ တစ်ခါတစ်ရံ မိမိမျှော်လင့်ထားသည့်အတိုင်း အရာရာအဆင်မပြေနိုင်ပါ။ အလုပ်အကိုင်တွင် အခက်အခဲများ ကြုံတွေ့နိုင်သကဲ့သို့ ပညာရေးနှင့် ကိုယ်ပိုင်ဘဝတွင်လည်း စိန်ခေါ်မှုများ ရှိနိုင်သည်။ ထိုအချိန်များတွင် လက်လျှော့မည့်အစား မိမိ၏ အမှားများမှ သင်ခန်းစာယူပြီး နောက်တစ်ကြိမ် ပိုမိုကောင်းမွန်အောင် ကြိုးစားသင့်သည်။ အမှားတစ်ခုသည် ကျရှုံးမှုတစ်ခုသာ မဟုတ်ဘဲ အတွေ့အကြုံအသစ်တစ်ခုလည်း ဖြစ်နိုင်သည်။

ထို့အပြင် အောင်မြင်မှုအတွက် အချိန်စီမံခန့်ခွဲမှုသည်လည်း အရေးကြီးသည်။ နေ့စဉ်လုပ်ဆောင်ရမည့် အလုပ်များကို ဦးစားပေးအစီအစဉ်ချမှတ်ပြီး အချိန်ကို အကျိုးရှိစွာ အသုံးပြုသင့်သည်။ အလုပ်နှင့် ကိုယ်ပိုင်ဘဝကြား မျှတမှုရှိရန်လည်း လိုအပ်သည်။ အလုပ်ကိုသာ အာရုံစိုက်ပြီး အနားယူချိန်မရှိပါက ရေရှည်တွင် စိတ်ပင်ပန်းမှုနှင့် အလုပ်ပင်ပန်းနွမ်းနယ်မှုများ ဖြစ်ပေါ်လာနိုင်သည်။ ထို့ကြောင့် အိပ်စက်အနားယူခြင်း၊ ကိုယ်လက်လှုပ်ရှားခြင်းနှင့် မိသားစု၊ မိတ်ဆွေများအတွက် အချိန်ပေးခြင်းတို့ကိုလည်း မမေ့သင့်ပါ။

နောက်ဆုံးတွင် အောင်မြင်မှုဆိုသည်မှာ လူတိုင်းအတွက် အဓိပ္ပာယ်တူညီနေမည်မဟုတ်ပါ။ အချို့သူများအတွက် အောင်မြင်မှုသည် ငွေကြေးချမ်းသာခြင်းဖြစ်နိုင်ပြီး အချို့သူများအတွက် မိမိနှစ်သက်သော အလုပ်ကို လုပ်ကိုင်နိုင်ခြင်း၊ မိသားစုကို စောင့်ရှောက်နိုင်ခြင်း သို့မဟုတ် စိတ်အေးချမ်းသာစွာ နေထိုင်နိုင်ခြင်းဖြစ်နိုင်သည်။ မိမိ၏ ရည်မှန်းချက်ကို သိရှိပြီး ထိုရည်မှန်းချက်အတွက် နေ့စဉ်ခြေလှမ်းငယ်များဖြင့် ကြိုးစားသွားခြင်းသည် အရေးကြီးဆုံးဖြစ်သည်။

လူငယ်များအနေဖြင့် မိမိကိုယ်ကို ယုံကြည်မှုရှိရှိဖြင့် အနာဂတ်ကို ရင်ဆိုင်သင့်သည်။ အခြားသူများနှင့် မိမိကိုယ်ကို အမြဲနှိုင်းယှဉ်နေမည့်အစား ယမန်နေ့က မိမိထက် ယနေ့မိမိ ပိုမိုတိုးတက်လာစေရန် ကြိုးစားသင့်သည်။ သင်ယူမှုကို ဘယ်တော့မှ မရပ်တန့်ဘဲ အတွေ့အကြုံအသစ်များကို လက်ခံသင်ယူနိုင်ပါက မိမိမျှော်မှန်းထားသော အနာဂတ်ကို တဖြည်းဖြည်း တည်ဆောက်နိုင်မည်ဖြစ်သည်။`;

/** AiVOOV rejects one request around 10000 UTF-8 bytes, so long text is spoken in pieces. */
function chunks(text, maxBytes = 8000) {
  const bits = String(text || '').split(/(?<=[။.!?])\s+/).filter(Boolean);
  const out = [];
  let cur = '';
  for (const bit of bits) {
    const next = cur ? `${cur} ${bit}` : bit;
    if (cur && Buffer.byteLength(next, 'utf8') > maxBytes) {
      out.push(cur);
      cur = bit;
    } else cur = next;
  }
  if (cur) out.push(cur);
  return out;
}

/** Speak Burmese text with AiVOOV and write an MP3. Needs AIVOOV_API_KEY in .env. */
export async function generateAivoovMp3(text, outPath) {
  const spoken = String(text || '').trim();
  const parts = [];
  let voice = '';
  for (const piece of chunks(spoken)) {
    const result = await generateHttpNarration({ text: piece, language: 'my', provider: 'aivoov' });
    voice = result.voice;
    parts.push(Buffer.from(result.audioBase64, 'base64'));
  }
  const audio = Buffer.concat(parts);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, audio);
  return { path: outPath, bytes: audio.length, voice, characters: spoken.length, words: spoken.split(/\s+/).filter(Boolean).length };
}

/** AiVOOV counts UTF-8 bytes, so a Burmese character costs about three of the balance. */
function withinBudget(text, budget) {
  const units = s => Buffer.byteLength(s, 'utf8');
  if (units(text) <= budget) return text.trim();
  const sentences = text.split(/(?<=[။.!?])\s*/);
  let chosen = '';
  for (const sentence of sentences) {
    const next = `${chosen}${sentence}`;
    if (chosen && units(next) > budget) break;
    if (!chosen && units(sentence) > budget) {
      let slice = '';
      for (const ch of sentence) {
        if (units(slice + ch) > budget) break;
        slice += ch;
      }
      return slice.trim();
    }
    chosen = next;
  }
  return chosen.trim();
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  loadEnv(root);
  const spoken = withinBudget(TEXT, 960);
  const outPath = resolve(root, 'tts', 'out', 'aivoov-youth.mp3');
  const info = await generateAivoovMp3(spoken, outPath);
  console.log(JSON.stringify({ path: info.path, bytes: info.bytes, voice: info.voice, characters: info.characters, words: info.words, billed: Buffer.byteLength(spoken, 'utf8') }));
}
