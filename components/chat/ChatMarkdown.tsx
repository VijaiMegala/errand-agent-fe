import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ChatMarkdown({ text }: { text: string }) {
  return (
    <div className="message-markdown">
      <Markdown remarkPlugins={[remarkGfm]} skipHtml>
        {text}
      </Markdown>
    </div>
  );
}
