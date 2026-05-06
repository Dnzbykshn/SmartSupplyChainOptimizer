# Smart Supply Chain Optimizer

Akıllı tedarik zinciri optimizasyon platformu. **Next.js** frontend, **Python** (CrewAI + LangGraph + MCP) backend ve **Supabase** veritabanı kullanır.

## Mimari

- **Frontend:** Next.js 16 + React 19 + TailwindCSS 4
- **Backend:** FastAPI + CrewAI + LangGraph + MCP (Model Context Protocol)
- **Veritabanı:** Supabase (Postgres)
- **LLM:** OpenAI (CrewAI ve LangChain üzerinden)

## Ön Gereksinimler

- **Node.js** 20+ (Next.js 16 için)
- **Python** 3.10+ (3.11 / 3.12 önerilir)
- **Git**
- **Supabase** projesi (URL + anon key)
- **OpenAI API key**

## Kurulum

### 1. Repoyu klonla

```bash
git clone <repo-url>
cd SmartSupplyChainOptimizer
```

### 2. Frontend bağımlılıkları

```bash
npm install
```

Kök dizinde `.env.local` oluştur:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<proje>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

### 3. Supabase şeması

Supabase SQL Editor'da sırayla çalıştır (veya `supabase db push` ile):

- `supabase/schema.sql`
- `supabase/migrations/` altındaki dosyalar
- `supabase/mcp_activity.sql` (MCP aktivite log tablosu)

### 4. Backend kurulumu

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

`backend/.env` oluştur:

```env
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://<proje>.supabase.co
SUPABASE_KEY=<anon-or-service-key>
# opsiyonel
LANGSMITH_API_KEY=...
```

### 5. MCP yapılandırması (opsiyonel)

`.mcp.json` Supabase MCP sunucusunu işaret eder. `project_ref` değerini kendi Supabase proje referansınla değiştir:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=<senin-proje-ref>"
    }
  }
}
```

## Çalıştırma

İki ayrı terminal aç:

**Backend (FastAPI, port 8000):**

```bash
cd backend
uvicorn src.api:app --reload --port 8000
```

**Frontend (Next.js, port 3000):**

```bash
npm run dev
```

Tarayıcıda aç: [http://localhost:3000](http://localhost:3000)

## Hızlı kontrol listesi

- [ ] Node.js ve Python kurulu
- [ ] `npm install` tamamlandı
- [ ] `.env.local` (Supabase keys) mevcut
- [ ] Supabase şeması yüklendi
- [ ] `pip install -r backend/requirements.txt` tamamlandı
- [ ] `backend/.env` (OpenAI + Supabase) mevcut
- [ ] Backend `:8000` ayakta
- [ ] Frontend `:3000` ayakta

## Proje yapısı

```
.
├── src/                  # Next.js uygulaması (App Router)
├── public/               # Statik varlıklar
├── backend/
│   ├── src/
│   │   ├── api.py                # FastAPI giriş noktası
│   │   ├── supply_chain_crew/    # CrewAI ajanları
│   │   ├── supply_chain_graph/   # LangGraph akışı
│   │   └── mcp_server/           # MCP sunucu entegrasyonu
│   └── requirements.txt
├── supabase/
│   ├── schema.sql
│   ├── migrations/
│   └── mcp_activity.sql
├── .mcp.json             # MCP sunucu konfigürasyonu
└── package.json
```

## Ek dokümanlar

- [MCP_DEMO.md](MCP_DEMO.md) — MCP entegrasyon demosu
- [MCP_IMPLEMENTATION_REPORT.md](MCP_IMPLEMENTATION_REPORT.md) — MCP mimari raporu
- [docs/](docs/) — ek teknik notlar
