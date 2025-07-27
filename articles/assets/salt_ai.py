import json
import os
import sys
from tkinter import filedialog, messagebox

import pdfplumber
import requests
import textract
from openai import OpenAI
from win11toast import toast

with open("apikey.ini", "r", encoding="utf-8") as f:
    key = f.read()
f.close
with open("maxhistory.ini", "r", encoding="utf-8") as f:
    MAX_HISTORY = int(f.read())
f.close
CONTEXT_FILE = "context.json"
client = OpenAI(api_key=str(key), base_url="https://api.deepseek.com")
text = ""
# 自动加载历史 context
if os.path.exists(CONTEXT_FILE):
    with open(CONTEXT_FILE, "r", encoding="utf-8") as f:
        send = json.load(f)
    f.close
else:
    with open("prompt.ini", "r", encoding="utf-8", errors="ignore") as f:
        prompt = f.read()
    f.close()
    with open("prompt2.ini", "r", encoding="utf-8", errors="ignore") as g:
        prompt2 = g.read()
    g.close()
    send = [
        {
            "role": "system",
            "content": prompt,
        },
        {
            "role": "system",
            "content": prompt2,
        },
    ]
content = ""
while True:
    try:
        a = toast("发送消息给 ソルト", content, input="...", button="发送")
        a = a["user_input"]["..."]
    except Exception:
        sys.exit(1)
    else:
        if a == "/quit":
            # 保存 context
            with open(CONTEXT_FILE, "w", encoding="utf-8") as f:
                json.dump(send, f, ensure_ascii=False, indent=2)
            sys.exit(1)
        elif a[0:4] == "/web":
            netdown = requests.get(a[5:])
            a = toast(
                "已经爬取到网页啦",
                a[5:] + "下载完成，下一步该干什么呢？",
                input="...",
                button="发送",
                duration="long",
            )
            a = a["user_input"]["..."]
            send.append({"role": "user", "content": netdown.text})
            send.append({"role": "user", "content": a})
        elif a[0:5] == "/file":
            path = filedialog.askopenfilename()
            file_ext = os.path.splitext(path)[1].lower()
            print(file_ext)
            if file_ext == ".pdf":
                with pdfplumber.open(path) as pdf:
                    for page in pdf.pages:
                        text += page.extract_text() + "\n"
                pdf.close()
            elif file_ext == ".docx" or file_ext == ".xlsx" or file_ext == ".pptx":
                text = textract.process(path).decode()
            else:
                with open(path, "r", encoding="utf-8", errors="ignore") as i:
                    text = i.read()
                i.close()
            send.append({"role": "user", "content": a[6:]})
            send.append(
                {"role": "user", "content": "Filename:" + os.path.basename(path)}
            )
            send.append({"role": "user", "content": text})
        elif a[0:4] == "/cmd":
            os.system(a[5:])
            break
        elif a[0:4] == "/set":
            b = toast(
                "设置",
                "选择一个项目",
                selection=[
                    "查看聊天记录",
                    "设置 API Key",
                    "默认查看器",
                    "最大允许聊天条数",
                ],
                button="确定",
            )
            if (
                str(b)
                == "{'arguments': 'http:确定', 'user_input': {'selection': '查看聊天记录'}}"
            ):
                os.system("notepad context.json")
            elif (
                str(b)
                == "{'arguments': 'http:确定', 'user_input': {'selection': '设置 API Key'}}"
            ):
                os.system("notepad apikey.ini")
            elif (
                str(b)
                == "{'arguments': 'http:确定', 'user_input': {'selection': '默认查看器'}}"
            ):
                b = toast(
                    "默认查看器",
                    "选择查看器————就是你点击查看按钮显示的东西啦",
                    selection=[
                        "Tkinter 提示框",
                        "系统 Notepad",
                    ],
                    button="确定",
                )
                if (
                    str(b)
                    == "{'arguments': 'http:确定', 'user_input': {'selection': 'Tkinter 提示框'}}"
                ):
                    with open("tk.ini", "w", encoding="utf-8", errors="ignore") as f:
                        f.write("1")
                    f.close()
                elif (
                    str(b)
                    == "{'arguments': 'http:确定', 'user_input': {'selection': '系统 Notepad'}}"
                ):
                    with open("tk.ini", "w", encoding="utf-8", errors="ignore") as f:
                        f.write("0")
                    f.close()
            elif (
                str(b)
                == "{'arguments': 'http:确定', 'user_input': {'selection': '最大允许聊天条数'}}"
            ):
                os.system("notepad maxhistory.ini")
        else:
            send.append({"role": "user", "content": a})
        # 节省 token，只保留最近 MAX_HISTORY 条
        context_to_send = [send[0]] + send[-MAX_HISTORY:]
        response = client.chat.completions.create(
            model="deepseek-chat", messages=context_to_send, stream=False
        )  # type: ignore
        content = response.choices[0].message.content
        send.append({"role": "assistant", "content": content})
        if a[0:4] == "@bat":
            b = toast(
                "是否允许 ソルト 执行此命令？",
                content,
                buttons=["允许", "查看", "拒绝"],
            )
            if str(b) == "{'arguments': 'http:允许', 'user_input': {}}":
                os.system(content)
            elif str(b) == "{'arguments': 'http:查看', 'user_input': {}}":
                messagebox.showinfo("检查命令合法性", content)
            elif str(b) == "{'arguments': 'http:拒绝', 'user_input': {}}":
                send.append({"role": "system", "content": "用户拒绝你提供的指令"})
        else:
            b = toast(
                "ソルト",
                content,
                buttons=["回复", "查看", "关闭会话"],
            )
            if str(b) == "{'arguments': 'http:查看', 'user_input': {}}":
                messagebox.showinfo("查看", content)
            elif str(b) == "{'arguments': 'http:关闭会话', 'user_input': {}}":
                break
with open(CONTEXT_FILE, "w", encoding="utf-8") as f:
    json.dump(send, f, ensure_ascii=False, indent=2)
sys.exit(1)
