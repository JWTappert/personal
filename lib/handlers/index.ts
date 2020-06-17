export function SuccessHandler(res) {
  res.status(200).json({ success: true });
}

export function ErrorHandler(res, message) {
  res.status(400).json({ success: false, message });
}
