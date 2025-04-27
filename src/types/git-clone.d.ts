declare module 'git-clone' {
  interface CloneOptions {
    checkout?: string;
    shallow?: boolean;
  }

  function gitClone(
    repo: string,
    targetPath: string,
    options: CloneOptions,
    callback: (error: Error | null) => void
  ): void;

  export = gitClone;
} 