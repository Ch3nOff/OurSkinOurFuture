import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image || typeof image !== "string") {
      return NextResponse.json({ hasGlasses: false, source: "no-image" }, { status: 200 });
    }

    let hasGlasses = false;
    let source = "none";

    if (process.env.YOUCAM_API_KEY && image.startsWith("data:")) {
      try {
        const base64 = image.split(",")[1] || image;
        const buffer = Buffer.from(base64, "base64");

        const fileInit = await fetch(
          `${process.env.YOUCAM_API_BASE || "https://yce-api-01.makeupar.com"}/s2s/v2.0/file/face-attribute`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.YOUCAM_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              files: [
                {
                  content_type: "image/jpeg",
                  file_name: "face.jpg",
                  file_size: buffer.length,
                },
              ],
            }),
          }
        );

        if (fileInit.ok) {
          const initData = await fileInit.json();
          const file = initData?.data?.files?.[0];
          if (file?.file_id && file?.requests?.[0]?.url) {
            const uploadUrl = file.requests[0].url;
            const signedHeaders = file.requests[0].headers || {};
            let uploadHost = "";
            try {
              uploadHost = new URL(uploadUrl).host;
            } catch {}

            const putHeaders = { ...signedHeaders };
            if (uploadHost) putHeaders["host"] = uploadHost;

            await fetch(uploadUrl, {
              method: "PUT",
              headers: putHeaders,
              body: buffer,
            });

            const taskRes = await fetch(
              `${process.env.YOUCAM_API_BASE || "https://yce-api-01.makeupar.com"}/s2s/v2.0/task/face-attribute`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${process.env.YOUCAM_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ src_file_id: file.file_id, format: "json" }),
              }
            );

            if (taskRes.ok) {
              const taskData = await taskRes.json();
              const taskId = taskData?.data?.task_id || taskData?.task_id;
              if (taskId) {
                for (let i = 0; i < 12; i++) {
                  await new Promise((r) => setTimeout(r, 1500));
                  const pollRes = await fetch(
                    `${process.env.YOUCAM_API_BASE || "https://yce-api-01.makeupar.com"}/s2s/v2.0/task/face-attribute/${taskId}`,
                    {
                      headers: { Authorization: `Bearer ${process.env.YOUCAM_API_KEY}` },
                    }
                  );
                  if (pollRes.ok) {
                    const pollData = await pollRes.json();
                    const status = pollData?.data?.task_status || pollData?.status;
                    if (status === "success" || status === "completed" || status === "done") {
                      source = "youcam";
                      const attrs = pollData?.data?.results?.output?.[0]?.face_attributes || pollData?.data?.results?.face_attributes || {};
                      if (attrs.wearing_glasses === true || attrs.glasses === true || attrs.has_glasses === true) {
                        hasGlasses = true;
                      }
                      break;
                    }
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn("YouCam glasses detect failed:", err.message);
        source = "youcam-failed";
      }
    }

    return NextResponse.json({ hasGlasses, source });
  } catch {
    return NextResponse.json({ hasGlasses: false, source: "error" }, { status: 200 });
  }
}
