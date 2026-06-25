import { ImageResponse } from "next/og";

// 180x180 is the size iOS uses for the home-screen icon.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Full-bleed brand green — iOS rounds the corners itself, so no rounded rect here.
const artwork = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#3e7c59"/>
  <path d="M132 372c0-150 112-244 252-244 0 152-112 244-228 244-7 0-15 0-24-1 19-46 53-84 100-110-58 23-86 60-100 111Z" fill="#f3f6ee"/>
  <path d="M256 300s-58 62-58 104a58 58 0 0 0 116 0c0-42-58-104-58-104Z" fill="#e2785f"/>
</svg>`;

export default function AppleIcon() {
  const src = `data:image/svg+xml;base64,${Buffer.from(artwork).toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="PlantPal" width={size.width} height={size.height} />
      </div>
    ),
    { ...size },
  );
}
