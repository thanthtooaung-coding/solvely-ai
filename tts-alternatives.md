# Whiteboard tutor — မြန်မာ + အင်္ဂလိပ် TTS ရွေးချယ်စရာ

Whiteboard tutor အတွက် လိုအပ်တာက နှစ်ဘာသာလုံး **မှန်ကန်စွာ ဖတ်နိုင်ခြင်း**၊ စာလုံးနဲ့ အသံ **တပြိုင်နက် sync** (word timing)၊ နဲ့ **stream** လုပ်နိုင်ခြင်း ဖြစ်တယ်။ အောက်က ဈေးနှုန်းတွေကို 2026-10-29 မှာ ရုံးစာမျက်နှာတွေနဲ့ နှိုင်းထားတယ်။ ကျွန်တော်တို့ ကိုယ်တိုင် နားထောင်ပြီး အတည်ပြုထားတာက ElevenLabs `eleven_v4` မြန်မာသံပဲ ဖြစ်တယ်။

## အကြံပြုချက်

| ရွေးချယ်မှု | ဘယ်အချိန် |
| --- | --- |
| **ElevenLabs v4 ဆက်သုံး** | မြန်မာအသံ အကောင်းဆုံးလိုချင်ရင်။ App ထဲမှာ ရှိပြီးသား။ စာလုံး 1,000 လျှင် $0.08။ |
| **Azure Speech (Nilar / Thiha)** | နှစ်ဘာသာလုံး တစ်ဆိုင်တည်း၊ စျေးသက်သာ၊ word boundary ပါ။ စာလုံး 1,000 လျှင် $0.015 လောက်။ အသံက v4 လောက် မချောဘူး။ |
| **Gemini TTS (app ထဲက fallback)** | ElevenLabs credit ကုန်ရင် အလိုအလျောက် သုံးနေပြီးသား။ မြန်မာအသံ အားနည်းတယ်။ Sync အတွက် transcribe ထပ်ခေါ်ရတယ်။ |
| **Cartesia, Amazon Polly, OpenAI, Google Chirp 3, ElevenLabs Flash** | မြန်မာစာကို တရားဝင် မပံ့ပိုးဘူး။ Whiteboard မြန်မာသင်ခန်းစာအတွက် မသုံးပါနဲ့။ |

## နှိုင်းယှဉ်ချက်

| | ElevenLabs v4 | Azure Neural | Gemini TTS (လက်ရှိ) | ကိုယ်တိုင် host (MMS) |
| --- | --- | --- | --- | --- |
| မြန်မာ | ရှိ။ `language_code=my` နဲ့ ကျွန်တော်တို့ transcription စစ်ပြီး | ရှိ။ `my-MM-NilarNeural` (မ)၊ `my-MM-ThihaNeural` (ကျား) | ဖတ်နိုင်ပေမယ့် အသံမမှန်တာ ကြုံပြီး | `facebook/mms-tts-mya` သီးသန့် |
| အင်္ဂလိပ် | အရမ်းကောင်း | Neural အများကြီး။ HD က မြန်မာမှာ မရှိ | ကောင်း | အင်္ဂလိပ် model သီးသန့် ထပ်လို |
| Stream | HTTP stream ရှိ။ v4 မှာ WebSocket chat မရ | REST stream ရှိ | ဖိုင်ပြန်ယူ | ကိုယ်တိုင် တည်ဆောက်ရ |
| စာလုံး timing | character alignment ပါ | `WordBoundary` (အသံ offset + စာသား) | transcribe ဒုတိယခေါ်ဆိုမှု | မပါ |
| စျေး (စာလုံး 1,000) | **$0.08** | **$0.015** (1 သန်းလျှင် $15) | Gemini token။ TTS သီးသန့် bill မဟုတ် | API မကုန်။ server ကုန် |
| Whiteboard နဲ့ ကိုက် | အကိုက်ဆုံး။ code ရှိပြီး | ဒုတိယ။ timing API ရှိလို့ ပြောင်းလို့ရ | fallback အနေနဲ့ပဲ | sync ပြန်ရေးရ၊ အသံကြမ်း |
| အသံအရေအတွက် (မြန်မာ) | voice library | ၂ ခုပဲ။ HD မဟုတ် | model ပေါ်မူတည် | ၁ ခု |

## ၁။ ElevenLabs v4 — ဆက်ထားသင့်တဲ့ အဆင့်

- မြန်မာစာကို `eleven_v4` + `language_code=my` နဲ့ ဖတ်တာ ကျွန်တော်တို့ Gemini transcription နဲ့ အတည်ပြုပြီး။ `eleven_v3` နဲ့ Flash က မြန်မာကို အင်္ဂလိပ်လို ဖတ်တယ်။
- စျေးက [API pricing](https://elevenlabs.io/pricing/api) အရ စာလုံး 1,000 လျှင် $0.08 (1 သန်းလျှင် $80)။
- အသေးစိတ် 100 user ခန့်မှန်းက `elevenlabs-pricing.md` မှာ ရှိတယ်။ အလယ်အလတ် 7.2 သန်း စာလုံးဆို **$576** လောက်။

## ၂။ Azure AI Speech — စျေးချိုပြီး နှစ်ဘာသာလုံး ရတဲ့ တစ်ခုတည်းသော API

Microsoft [language support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support) မှာ မြန်မာ `my-MM` ရှိတယ်။

- `my-MM-NilarNeural` — မ
- `my-MM-ThihaNeural` — ကျား
- နှစ်ခုလုံး **Standard Neural**။ Neural HD စာရင်းမှာ မပါ။
- အင်္ဂလိပ်က `en-US` စတဲ့ Neural အသံတွေ အများကြီး ရှိတယ်။ တစ် request ကို တစ်ဘာသာပဲ။ မြန်မာသင်ခန်းစာမှာ မြန်မာအသံ၊ အင်္ဂလိပ်သင်ခန်းစာမှာ အင်္ဂလိပ်အသံ ခွဲသုံးရမယ်။ ဒါက လက်ရှိ app လုပ်နေတဲ့ပုံစံနဲ့ တူတယ်။

Whiteboard အတွက် အရေးကြီးတာက [WordBoundary](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis) event ဖြစ်တယ်။ စကားလုံးတစ်လုံးစီရဲ့ audio offset ပြန်ပေးလို့ ဘုတ်ပေါ်က စာရိုက် animation ကို အသံနဲ့ ချိတ်လို့ရတယ်။ [REST streaming](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-text-to-speech) လည်း ရှိတယ်။

စျေး ([Azure Speech pricing](https://azure.microsoft.com/en-us/pricing/details/speech/)၊ 2026-10) —

- Free F0: Neural စာလုံး **500,000** / လ
- Neural: **$15 / 1 သန်း စာလုံး** (စာလုံး 1,000 လျှင် $0.015)
- SSML tag အများစု၊ space၊ ပုဒ်ဖြတ် အပါအဝင် ရေတွက်တယ်

အရင်စာရွက်က 100 user အလယ်အလတ် **7.2 သန်း** စာလုံးဆို Azure မှာ **$100 လောက်** (အခမဲ့ 0.5 သန်း နုတ်ပြီး)။ ElevenLabs v4 ရဲ့ $576 နဲ့ယှဉ်ရင် ၅ ဆကျော် သက်သာတယ်။ အသံချောမှုကတော့ v4 အောက် ဖြစ်နိုင်တယ်။ ဒီစာရွက်ရေးချိန်မှာ Nilar/Thiha ကို ကျွန်တော်တို့ နားမထောင်ရသေးဘူး။

## ၃။ Gemini TTS — app ထဲမှာ ရှိပြီးသား

`GEMINI_API_KEY` နဲ့ `gemini-3.8-flash-lite-tts` က ElevenLabs credit ကုန်ရင် အလိုအလျောက် ပြန်သုံးတယ်။ စာလုံး timing အတွက် Gemini transcribe ကို ဒုတိယအကြိမ် ခေါ်ရတယ်။ မြန်မာအသံက ElevenLabs v4 လောက် မတည်ငြိမ်လို့ ElevenLabs ကို ပြောင်းခဲ့တာ ဖြစ်တယ်။ စျေးချိုတဲ့ fallback အနေနဲ့ ထားပါ။ ပင်မအသံအဖြစ် ပြန်မတင်ပါနဲ့။

## မသုံးသင့်တဲ့ model တွေ

| Model | ဘာလို့ မကိုက်လဲ |
| --- | --- |
| ElevenLabs Flash / Turbo / v3 | မြန်မာ `language_code` ကို လက်မခံ၊ သို့မဟုတ် မြန်မာစာကို အင်္ဂလိပ်လို ဖတ်တယ်။ v3 ကို transcription နဲ့ ကိုယ်တိုင်တွေ့ပြီး။ |
| Google Chirp 3 HD | [ဘာသာစကားစာရင်း](https://docs.cloud.google.com/text-to-speech/docs/chirp3-hd) မှာ မြန်မာ မပါ။ အင်္ဂလိပ်က ကောင်းပြီး $30 / 1 သန်း။ Speech-to-Text Chirp မှာတော့ `my-MM` ရှိတယ်။ အသံထုတ်တာ မဟုတ်။ |
| Cartesia Sonic 3.6 | [44 ဘာသာ](https://docs.cartesia.ai/build-with-cartesia/tts-models/latest)။ မြန်မာ မပါ။ |
| Amazon Polly | [ဘာသာစကားစာရင်း](https://docs.aws.amazon.com/polly/latest/dg/supported-languages.html) မှာ မြန်မာ မပါ။ |
| OpenAI TTS | မြန်မာ TTS ကို တရားဝင် မဖော်ပြထား။ Whisper က နားထောင်တာပဲ။ |

## ကိုယ်တိုင် host — API ငွေမကုန်ချင်ရင်

[facebook/mms-tts-mya](https://huggingface.co/facebook/mms-tts-mya) က မြန်မာ TTS အခမဲ့ model ဖြစ်တယ်။ အင်္ဂလိပ်အတွက် Piper / Kokoro လို model တစ်ခု ထပ်လိုတယ်။ အသံက စက်သံပိုဆန်တယ်။ Stream နဲ့ word timing ကို ကိုယ်တိုင် တည်ဆောက်ရတယ်။ Server တစ်လုံး ထိန်းရတယ်။ 100 user realtime ဆို GPU ရှိမှ တည်ငြိမ်မယ်။

## 100 user တစ်လ — အသံဖိုးပဲ

`elevenlabs-pricing.md` က အလယ်အလတ် 7.2 သန်း စာလုံးနဲ့ တူတဲ့ ယူဆချက်။

| | စာလုံး 1,000 | 7.2 သန်း |
| --- | ---: | ---: |
| ElevenLabs v4 (မြန်မာအားလုံး) | $0.08 | **$576** |
| Azure Neural | $0.015 | **~$100** |
| MMS ကိုယ်တိုင် | $0 | server + GPU |

သင်ခန်းစာစာသားကို Gemini နဲ့ ရေးတာက ဒီဇယားထဲ မပါ။
