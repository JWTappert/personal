export default function PostBody({ content }) {
  return (
    <div>
      <div
        style={{ overflowY: "auto", marginBottom: "5em" }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
