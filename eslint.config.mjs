import nextConfig from "eslint-config-next";
import coreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextConfig,
  ...coreWebVitals,
  {
    ignores: [
      ".next/",
      "out/",
      "build/",
      "dist/",
      "public/uploads/",
      "prisma/migrations/",
      "docs/",
      "coverage/",
    ],
  },
];

export default eslintConfig;
