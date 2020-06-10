import DateFormater from "./date-formatter";
import PostTitle from "./post-title";

export default function PostHeader({ title, date, author }) {
  return (
    <>
      <PostTitle>{title}</PostTitle>
      <div>
        <div>
          <DateFormater dateString={date} />
        </div>
      </div>
    </>
  );
}
