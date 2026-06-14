# Wanna Bet?

WannaBet originally launched in July 2024 as a simple peer-to-peer betting app. We're now rebuilding it from the ground up with a focus on smart contract composability and a simple web-first UX, available at [heywannabet.com](https://heywannabet.com) and [app.heywannabet.com](https://app.heywannabet.com).

## Contributing

This is a pnpm monorepo with the following packages: [`webapp`](./webapp/README.md) (Next.js), [`indexer`](./indexer/README.md) (Ponder), [`contracts`](./contracts/README.md) (Hardhat 3). You can read more about each package in their respective README files.

To get started, run `pnpm install` in the root to install the dependencies for all packages. Then run the relevant `dev` or `build` scripts found in any of the `package.json` files.

> [!NOTE]
> When installing new packages, first check to see if it's already being used elsewhere in the repo. If it is, pin it in [`pnpm-workspace.yaml`](./pnpm-workspace.yaml) and set the version in `package.json` to `catalog:`.
