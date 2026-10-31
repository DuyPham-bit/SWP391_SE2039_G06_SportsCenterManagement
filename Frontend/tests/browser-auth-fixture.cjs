// The browser fixtures follow the same HttpOnly cookie + tab-header contract as the API.
exports.issueBrowserSession = (req, res, credential) => {
  const id = req.headers['x-scms-session'];
  if (!/^[a-f0-9]{32}$/.test(id || '')) throw new Error('Missing browser fixture session selector');
  res.setHeader('Set-Cookie', `scms.session.${id}=${credential}; HttpOnly; SameSite=Strict; Path=/api`);
  return { accessToken: null };
};

exports.browserCredential = req => {
  const name = `scms.session.${req.headers['x-scms-session']}=`;
  return (req.headers.cookie || '').split('; ').find(cookie => cookie.startsWith(name))?.slice(name.length);
};
