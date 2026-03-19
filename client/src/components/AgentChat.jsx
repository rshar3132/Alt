// 
// components/AgentChat.jsx
import { useState } from "react";
import axios from "axios";

const AgentChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const token = localStorage.getItem("accessToken");

    const updatedMessages = [...messages, { role: "user", content: input }];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const { data } = await axios.post("/api/agent",
        { messages: updatedMessages },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages([...data.messages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white shadow-xl rounded-xl flex flex-col">
      <div className="bg-blue-600 text-white p-3 rounded-t-xl font-semibold">
        ✈️ Flight Assistant
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-96">
        {messages.map((m, i) => {
          // ✅ skip tool messages — user doesn't need to see raw tool data
          if (m.role === "tool") return null;

          // ✅ safely extract text regardless of content type
          let text;
          if (typeof m.content === "string") {
            text = m.content;
          } else if (Array.isArray(m.content)) {
            text = m.content.find(b => b.type === "text")?.text ?? "";
          } else {
            return null; // skip anything else weird (tool_calls objects etc)
          }

          if (!text) return null; // skip empty

          return (
            <div
              key={i}
              className={`p-2 rounded-lg text-sm ${
                m.role === "user" ? "bg-blue-100 ml-8" : "bg-gray-100 mr-8"
              }`}
            >
              {text}
            </div>
          );
        })}
        {loading && <div className="text-gray-400 text-sm">Thinking...</div>}
      </div>
      <div className="flex gap-2 p-3 border-t">
        <input
          className="flex-1 border rounded px-2 py-1 text-sm"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Ask me anything..."
        />
        <button onClick={sendMessage} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">
          Send
        </button>
      </div>
    </div>
  );
};

export default AgentChat;