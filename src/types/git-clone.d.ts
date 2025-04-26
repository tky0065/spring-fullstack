declare module 'git-clone' {
  function gitClone(
    url: string,
    targetPath: string,
    options?: any,
    callback?: (error?: Error) => void
  ): void;
  export = gitClone;
} 