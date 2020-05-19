export default (req, res) => {
  if (req.method === "POST") {
    res.status(200).end("Yeee");
  }
  if (req.method === "GET") {
    res.status(400).end("Incorrect request");
  }
};
