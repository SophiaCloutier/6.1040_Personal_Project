const child = Bun.spawn(['bun', 'run', 'start'], {
  env: { ...process.env, PORT: '3000', PUBLIC_ORIGIN: 'http://localhost:3000' },
  stdin: 'inherit', stdout: 'inherit', stderr: 'inherit',
});
process.exit(await child.exited);
