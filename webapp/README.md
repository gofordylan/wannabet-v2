# Website

A standalone web app to interact with the WannaBet [smart contracts](../contracts/README.md), with bet data from the [indexer](../indexer/README.md) and user identity resolved via ENS (including `*.wannabet.eth` subnames).

Deployed at https://app.heywannabet.com (marketing site at https://heywannabet.com).

## Usage

Create a `.env.local` file and enter your environment variables:

```bash
cp .env.example .env.local
```

To start the development server, run:

```bash
pnpm dev
```
