import nextConfig from "eslint-config-next";

export default [
  ...nextConfig,
  {
    rules: {
      // Allow img elements (Next Image not needed for all cases)
      "@next/next/no-img-element": "off",
    },
  },
  {
    // Homepage components use bespoke CSS with inline apostrophes and custom ref patterns
    files: ["src/components/homepage/**"],
    rules: {
      "react/no-unescaped-entities": "off",
      "react-hooks/refs": "off",
    },
  },
  {
    ignores: [".next/", "node_modules/", ".claude/"],
  },
];
