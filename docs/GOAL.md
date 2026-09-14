# Goal

## 專案概念

1. 這個遊戲的概念是利用電腦視覺、OCR、Feature extraction、local host 的方式先做出小型 MVP。第一版不假設單一模型能完成全部事情，而是把模型分成多個角色：

   - OCR model：讀取照片中可能出現的文字，例如衣服、名牌、招牌、文件上的字。
   - Vision / Feature extraction model：分析非身份特徵，例如顏色、構圖、服裝感、姿態、明暗、線條密度。
   - Rule / Algorithm layer：把 OCR 與特徵分析結果轉成角色設定、數值、技能與稀有度。這一層的算法後續再定義。
   - Picture generation model：根據原照片與角色設定生成卡牌封面或角色圖。

   這條管線像工廠產線：讀字員、觀察員、編劇、畫師分工合作，而不是要求一個人做完整間工廠。

2. 資料流想像是：

   ```text
   手機或電腦拍照
     -> OCR model 讀取照片文字
     -> Vision / Feature extraction model 分析非身份特徵
     -> Structured Text / Character Spec
     -> Rule / Algorithm layer 定義角色數值、技能、稀有度
     -> 生成獨特卡牌角色
     -> Picture generation model 或本機 Canvas 產生卡牌封面
     -> 養成系統，可能是走路或對話來累積經驗值
     -> 利用養成的角色來戰鬥
   ```

3. 目前先以本地開發為主，模型使用開源模型。現有機器資源為此 Mac Air。

## 本地模型與替代方案

- 優先選擇能在這台 Mac Air 上執行的開源模型或本機演算法。
- 如果某個模型在 Mac Air 上太慢或跑不動，先使用較輕量的替代方案完成 MVP。
- OCR 與 Feature extraction 優先本機執行。
- Picture generation 是最吃資源的部分，因此 MVP 需要保留替代路線。
- 未來可以加入雲端 API 作為高品質模式，但不是本地 MVP 的必要條件。

## 目標驗證平台

目前系統驗證目標是 iOS 與 Mac，但兩者分工不同：

- iOS：優先驗證拍照、上傳、預覽、卡牌操作與遊戲體驗。
- Mac：優先驗證本地照片分析、VLM 語意標籤、Prompt Builder、外部圖片 API adapter、卡牌合成與開發伺服器。

第一版不把 SDXL、FaceID、ComfyUI、MFLUX 這類重模型放進 iPhone 內跑。MVP 先採用：

```text
iPhone 或 Mac Browser
  -> 拍照 / 上傳照片
  -> Mac 本機 Node server
  -> Google Gemini / Nano Banana API 或本機 Canvas fallback
  -> 回傳卡圖
  -> Browser 組成卡牌與數值
```

比喻：iPhone 先當相機和遊戲手把，Mac 先當本地 AI 工房。等玩法和資料流成立後，再決定要用 Godot、Swift、React Native、Core ML 或雲端模式做正式產品化。

## Picture -> Structured Text -> Picture

MVP 的核心資料流不是單純 `picture -> text -> picture`，而是：

```text
picture
  -> structured text
  -> picture
```

其中 `structured text` 指的是 `Character Spec`，也就是機器可讀的角色設定資料。它像角色的「能力表與設定書」，後續卡牌封面、技能、養成、戰鬥都以它為核心。

整體產品產線的 canonical 文件是 [SYSTEM_PIPELINE.md](./SYSTEM_PIPELINE.md)。要拆模組、接模型、改存檔或決定下一步實作前，先讀那份文件。

## AI 卡圖與角色特色

AI 卡圖需要同時達成兩件事：

1. 保留本人長相與可辨識的主要視覺特徵。這裡的「保留」是創作上的 likeness preservation，不是身份驗證或臉部辨識。
2. 依照照片細節與使用者補充說明，產生角色獨有特徵，並且讓這些特徵影響技能、卡片資訊與遊戲機制。

比喻：照片像角色的原石，使用者補充像角色的背景故事，Character Spec 像角色卡的設定書。AI 卡圖是畫師照著設定書畫圖；戰鬥與養成系統則是裁判照著設定書算規則。

AI 不能直接決定遊戲規則。模型可以讀字、觀察非敏感照片特徵、提出卡圖素材建議；角色數值、技能、稀有度、成長規則必須由 Rule / Algorithm layer 依照明確規則產生。

比喻：AI 是偵查員和畫師，Rule / Algorithm layer 是裁判。偵查員可以提供線索，畫師可以畫圖，但裁判才決定 HP、ATK、DEF 和技能效果。

這個遊戲最大的賣點是：玩家拍下來的照片與 User 資訊會生成一張獨特 Battle Card，而不是只生成一張好看的圖。每張 Battle Card 都要包含：

- AI 生成或本機 fallback 的卡牌封面。
- Card Stat Line，例如 HP、ATK、DEF、COST、Level。
- 由照片細節與 User 資訊轉換出的 Traits。
- 由規則層產生的 Skills。
- 可被養成系統改變的成長狀態，例如 XP、Level、勝敗紀錄。
- 養成回饋採用完整方向：數值提升、技能強化、技能分支進化、卡面視覺進化。角色最高等級為 Lv.100，進化節點採神奇寶貝式節奏：Lv.16、Lv.36、Lv.70、Lv.100。MVP 的「跑通」必須包含實際 Visual Evolution 生圖：升級觸發進化後，先讓玩家選 Skill Branch，再用 Character Spec、Progression State、Branch hooks 和來源圖/前一版卡圖建立 Evolution Prompt Profile，送到 Card Art Provider 生成進化卡圖並保存為新 art revision。Skill Branch 選項來源已確認採 D：每次分支選擇固定提供一個 `combatVariant` 路線與一個照片/VLM/故事 `characterHook` 路線。卡框、光效、徽章只能作為輔助呈現或失敗 fallback，不能單獨算進化完成。

比喻：照片和 User 資訊不是貼紙，而是角色的 DNA。卡圖、能力值、技能、養成路線都要從這份 DNA 長出來。

可用輸入包含：

- 照片細節：服裝、配色、姿態、場景、光線、OCR 文字。
- 使用者補充：年齡印象、角色背景、職業或身份、個性、偏好、價值觀、性向、政治取向等。
- Capture Context：拍攝時間、概略地點、天氣、場所類型。

角色背景提問初稿記錄在 [CHARACTER_QUESTIONS.md](./CHARACTER_QUESTIONS.md)。

`Character Spec` 的詳細定義記錄在 [CHARACTER_SPEC.md](./CHARACTER_SPEC.md)。目前 Character Spec 的主要來源包含：原拍照的時間與 Location Reference、User 問卷內容、VLM/OCR/Photo Analysis 產生的 Vision Context、以及根據當地時間與地點整理出的 Event Context。這些來源會同時影響圖片生成與遊戲規則：圖片端透過 `Prompt Profile`，規則端透過 deterministic Rule Tables，例如 `Event Combat Profile`。精確位置、敏感資訊與未確認事件不能直接丟給圖片模型，也不能讓 AI 直接決定 stats 或 skills。

目前已實作第一個 Character Spec context module：[`src/card-generation/character-spec.js`](../src/card-generation/character-spec.js)。它會整理 Capture / Questionnaire / Vision / Event Context，定義 GPS、地址、Google Maps place、節日來源的取得方法，並輸出圖片模型可直接使用的 Prompt Hooks。`src/card-generation/rule-data.js` 也已包含 event/season combat profiles，讓節慶與季節能影響 stats、traits、archetype bias、skills、lore 與卡圖 motif。完整產卡流程仍會在後續小步驟從 `app.js` 繼續拆成深模組。

除了問卷欄位以外，Capture / Event Context 會自動取得：上傳 JPEG 先讀 EXIF 拍攝時間與 GPS；沒有 EXIF GPS 時使用 Browser Geolocation；server 端透過 Google Geocoding / Places 解析地址與 Google Maps place。節慶事件目前先固定做美國 public holidays，使用生成當下的現實世界日期查 Nager.Date，不使用舊照片 EXIF 日期。沒有 Google Maps key 時不產生 Google Maps URL fallback，只用內部地點 hook 保持生成流程可跑，避免增加使用者操作成本。

目前處理順序：

1. 先處理 `GOOGLE_MAPS_API_KEY`，讓自動地址、Google Place、place type 穩定。
2. 接著處理問卷產品決策：一般角色欄位改成 VLM Creative Roll + User 4 選 1 + VLM-auto reviewable fields；敏感資訊仍只能由 User 明確提供，不能由系統自動推測。
3. 最後再處理 Gemini / OpenAI 生圖 API key，用穩定的 Character Spec 和 prompt hooks 去比較圖片品質。

問卷產品決策的 current schema 已建立在 [`src/card-generation/questionnaire-schema.js`](../src/card-generation/questionnaire-schema.js)。它定義了 `VLM Creative Roll`：年齡印象、價值觀、弱點由 VLM 各產生 4 個候選，未來用逐步彈窗讓 User 選 1 個；價值觀候選需要一句角色敘事，不顯示 VLM tags；故事事件由 VLM 產生 4 個候選後由系統 seed 隨機選 1 個；身份/背景、性格、專長、戰鬥風格、招牌物品、卡面氣質由 VLM 自動產生並可 review。所有欄位都要說明如何影響 Character Spec、prompt hooks、stats、traits、skills。Capture / Event Context 不再放進問卷，已由自動化流程處理。

第一個候選生成模組已建立在 [`src/card-generation/questionnaire-candidates.js`](../src/card-generation/questionnaire-candidates.js)，server 入口是 `POST /api/questionnaire-candidates`。它會優先請本機 VLM 產生 4 選 1 候選與 VLM-auto 欄位；如果 VLM 失敗，回傳 deterministic safe fallback，確保遊戲流程不中斷。這個 endpoint 只產生候選，不替 User 選答案，也不能直接決定 stats。

目前 UI 決策：拍照或上傳後先跳出角色名字輸入；空白預設 `路人`。生成出的 Battle Card name 必須包含這個名字，例如 `潮流昶志` 或 `陽光球員昶志`。Character Roll 選項未來做成彈窗，不在當前主畫面加常駐問卷 UI。

敏感資訊規則：

- 性向、政治取向、宗教、健康等敏感資訊只能由本人或有明確同意的照片當事人主動提供。
- 系統不能從照片、OCR、location、time 推測敏感資訊。
- 如果照片中的人不是使用者本人，需要先取得照片當事人同意，才可使用照片與敏感背景作為生成材料。
- 沒有提供敏感資訊時，使用 Default Generation Template，不把缺少資料當成錯誤。

這些特色要進入遊戲機制，而不只是寫在卡片描述上。例如：

- 場景是夜晚城市：可增加影系、速度、潛行或反擊技能傾向。
- 照片有運動感：可增加速度、力量或連擊技能傾向。
- 使用者補充是研究者背景：可增加專注、分析、控制或支援技能傾向。
- 拍攝地點是海邊或雨天：可增加水系、回復、流動或防禦技能傾向。
- 沒有 location/time：使用預設的中性訓練場模板。

## 卡牌封面生成策略

卡牌封面的產品目標是 Picture generation。也就是根據 Source Photo 與 Character Spec，生成一張新的角色卡面，而不是只把照片放進模板。

工程上仍保留兩條路線：

- 本機 Picture generation 卡牌封面：使用開源圖片生成模型，把照片與 Character Spec 重新畫成新的角色卡面。它像請畫師重新畫一張圖，視覺效果可能更好，但更慢、更吃硬體，也比較需要調模型與參數。
- 本機 Canvas 卡牌封面：不需要圖片生成模型，由程式把照片、邊框、文字、顏色、特效組成卡牌。它像用現成素材與模板排版，速度快、穩定、適合作為 fallback。

MVP 的目標路線是：優先研究並接上本機 Picture generation；如果 Mac Air 當下跑不動，Canvas fallback 仍要讓遊戲主流程可以繼續開發。

更完整的本地圖片生成研究記錄在 [LOCAL_IMAGE_GENERATION.md](./LOCAL_IMAGE_GENERATION.md)。

目前狀態：專案已加入 ComfyUI 本機連線檢查與 `/api/comfy-card-art` adapter。這台 Mac Air 已可啟動本機 ComfyUI，使用 MPS 裝置，並已用 `docs/comfyui-workflows/sdxl-turbo-img2img-api.json` 和 SDXL Turbo checkpoint 成功產出 768x1024 PNG smoke image。該 plain img2img baseline 與原圖差異太大，已明確拒絕作為本人相似度或美術品質基準，只保留為 adapter smoke test；`docs/comfyui-workflows/sdxl-turbo-faceid-img2img-api.json` 已接上 IP-Adapter FaceID 並成功產出有效 PNG，相似度比 rejected baseline 好，但目前仍太像照片修飾，不像最終戰鬥卡圖。`docs/comfyui-workflows/sdxl-turbo-faceid-txt2img-api.json` 有較強美術化潛力，但肢體與手部不穩。結論是：SDXL Turbo / FaceID 路線只保留為歷史 baseline，不再作為最高優先調參方向。

曾經測過 `Flux Kontext GGUF` 作為 ComfyUI 路線，但在這台 Mac Air 上速度不符合遊戲體驗：`880x1184`、4 steps 的預覽約 12m34s。MFLUX / MLX 也被判定不適合作為當前 MVP 主線，因為高品質且保留本人特徵的本地生圖對這台硬體仍然太勉強。因此新的最高優先生圖實驗改為雲端 `Card Art Provider`：先接 `Google Gemini / Nano Banana API` 與 `OpenAI Image API`，用同一張來源照片與同一份 prompt 做比較。Mac 先負責照片分析、VLM 語意標籤、Prompt Builder、遊戲規則與卡牌合成；圖片生成交給外部 API。這仍是技術驗證，不是最終美術方向。完整研究記錄在 [LOCAL_IMAGE_GENERATION.md](./LOCAL_IMAGE_GENERATION.md)。

目前開發焦點收斂為圖片生成 pipeline 與效果驗收：

```text
Source Photo
  -> Photo Signal
  -> OCR Text Seed
  -> Visible Semantic Tags
  -> Character Spec / Prompt Profile
  -> identity-preserving picture generation
  -> Effect Review
```

敵人資料、戰鬥系統、養成、Deck balance 先暫停。等一張本地生成圖通過 [IMAGE_PIPELINE_ACCEPTANCE.md](./IMAGE_PIPELINE_ACCEPTANCE.md) 的 likeness、照片語意、乾淨角色圖層與卡圖潛力驗收後，再恢復下游玩法。

目前順序：先把 `Visible Semantic Tags` 做到 VLM 可產生、可人工確認、可分組、可進 prompt 的高階滿意版本，並把圖片生成最高優先實驗切到雲端 `Card Art Provider`，先比較 `Gemini / Nano Banana API` 與 `OpenAI Image API`。人工輸入只作為 VLM adapter 完成前的校準與覆寫，不是最終玩家流程。原因是如果照片語意輸入不穩，換模型後也無法判斷失敗原因。

## UI 方向

目前 UI 方向參考手機抽卡 RPG 的高資訊密度角色卡，以及 Hearthstone 的卡牌移動手感。

- 角色庫需要清楚顯示角色圖、稀有度、屬性、等級、HP、ATK、DEF、COST。
- 角色詳情頁需要以大角色圖為主，搭配醒目的數值、技能、等級條、養成按鈕。
- 戰鬥時卡牌應該像實體卡片一樣移動、放大、彈回、發光，而不是只是普通網頁按鈕。

更完整的 UI 參考記錄在 [UI_REFERENCE.md](./UI_REFERENCE.md)。

## 創意參考遊戲

更完整的參考整理在 [REFERENCE_GAMES.md](./REFERENCE_GAMES.md)。

## Skill 使用定義

- `router`：遇到比較大的遊戲開發問題、跨多個領域、或不確定該用哪個專門 skill 時使用。若任務很明確，例如只改存檔、UI、卡牌規則，就直接使用對應 skill。
- `domain-modeling`：命名、概念、規則語言不清楚時用，例如 `Character Spec`、`Battle Card` 是什麼。
- `codebase-design`：要拆模組時用，例如把 `app.js` 拆成角色生成、圖片生成、戰鬥模組。這像決定「廚房、櫃台、倉庫」各自負責什麼。
- `card-game`：設計卡牌數值、技能、稀有度、對戰規則時用。
- `game-ui-ux`：設計遊戲畫面、按鈕流程、戰鬥 UI、卡牌庫 UI 時用。
- `create-game-assets`：做卡牌美術風格、角色圖 prompt、素材規格時用。
- `save-systems`：做角色保存、版本升級、localStorage 或未來雲端存檔時用。
- `archify`：需要理解 system architecture、資料流、流程圖、API 呼叫順序、狀態轉換時用。它像把整個遊戲工廠的生產線畫成地圖，讓系統怎麼流動一眼看懂。
- `openai-docs`：只要牽涉 OpenAI API、模型、價格、圖片生成，我會查官方文件再決定。

## Skill 調用原則

- 每次只讀取與當前小任務直接相關的 skill。
- 任務方向改變時，才重新選擇或增加 skill。
- 如果任務橫跨多個領域，先用 `router` 決定最小必要 skill 組合。

## 工作方式

- 每次實作只做一小步。
- 不臆測規格；方向不清楚時先問清楚。
- 遇到遊戲開發觀念或專有名詞時，用比喻說明。
- 優先完成本地可跑的 MVP，再逐步解耦。
