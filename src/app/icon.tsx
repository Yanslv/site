import { ImageResponse } from "next/og";

// Favicon provisório e tipográfico (monograma "B"), até que a marca envie
// um logo oficial em PNG/SVG. Não representa a logo definitiva da clínica.
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#7E3948",
          color: "#FAF6F3",
          fontSize: 20,
          fontWeight: 600,
          fontFamily: "serif",
          borderRadius: "50%",
        }}
      >
        B
      </div>
    ),
    { ...size }
  );
}
