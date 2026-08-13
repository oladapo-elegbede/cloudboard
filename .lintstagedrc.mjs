export default {
  "*.{ts,tsx,js,jsx,mjs,cjs}": (files) => {
    const nonWebFiles = files.filter(
      (file) => !file.includes("apps/web") && !file.includes("apps\\web"),
    );
    const commands = [];
    if (nonWebFiles.length > 0) {
      commands.push(`eslint --fix ${nonWebFiles.join(" ")}`);
    }
    commands.push(`prettier --write ${files.join(" ")}`);
    return commands;
  },
  "*.{json,md,yml,yaml}": ["prettier --write"],
};
