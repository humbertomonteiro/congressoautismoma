import { useState, useRef, useEffect, useCallback } from "react";
import styles from "./photoFrame.module.css";
import frameTemplate from "../../assets/frames/frame-euvou.jpeg";

// Processes the template image:
// 1. Detects the white photo area bounding box from the central region
// 2. Makes white/light pixels transparent (more aggressive inside the photo area to remove gray placeholder text)
// Returns { canvas: offscreenCanvas, frame: { x, y, w, h } }
function processTemplate(img) {
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const offscreen = document.createElement("canvas");
  offscreen.width = W;
  offscreen.height = H;
  const ctx = offscreen.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, W, H);
  const d = imageData.data;

  // Scan the central band to find the photo area (bright white rectangle)
  const xMin = Math.floor(W * 0.05);
  const xMax = Math.floor(W * 0.95);
  const yMin = Math.floor(H * 0.18);
  const yMax = Math.floor(H * 0.82);
  let fX0 = xMax, fX1 = xMin, fY0 = yMax, fY1 = yMin;

  for (let y = yMin; y < yMax; y++) {
    for (let x = xMin; x < xMax; x++) {
      const i = (y * W + x) * 4;
      if (d[i] > 200 && d[i + 1] > 200 && d[i + 2] > 200) {
        if (x < fX0) fX0 = x;
        if (x > fX1) fX1 = x;
        if (y < fY0) fY0 = y;
        if (y > fY1) fY1 = y;
      }
    }
  }

  const frame =
    fX0 < fX1 && fY0 < fY1
      ? { x: fX0, y: fY0, w: fX1 - fX0 + 1, h: fY1 - fY0 + 1 }
      : { x: 73, y: 375, w: 664, h: 730 };

  // Only erase pixels inside the photo area — never touch the border/text outside it
  // Threshold 140 removes both the white background and gray placeholder text
  for (let y = frame.y; y <= frame.y + frame.h; y++) {
    for (let x = frame.x; x <= frame.x + frame.w; x++) {
      const i = (y * W + x) * 4;
      if (d[i] > 140 && d[i + 1] > 140 && d[i + 2] > 140) {
        d[i + 3] = 0;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return { canvas: offscreen, frame };
}

const PhotoFrame = () => {
  const canvasRef = useRef(null);
  const dragRef = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    posAtStart: { x: 0, y: 0 },
  });
  const pinchRef = useRef({ active: false, startDist: 0, scaleAtStart: 1 });

  // Canvas dimensions match template's natural size (set after template loads)
  const [cw, setCw] = useState(810);
  const [ch, setCh] = useState(1440);
  const [frame, setFrame] = useState({ x: 73, y: 375, w: 664, h: 730 });

  const [userPhoto, setUserPhoto] = useState(null);
  const [pos, setPos] = useState({ x: 73, y: 375 });
  const [scale, setScale] = useState(1);
  const [overlay, setOverlay] = useState(null);
  const [ready, setReady] = useState(false);

  // Load and process the template
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const { canvas, frame: detected } = processTemplate(img);
      setOverlay(canvas);
      setFrame(detected);
      setCw(img.naturalWidth);
      setCh(img.naturalHeight);
      setPos({ x: detected.x, y: detected.y });
      setReady(true);
    };
    img.onerror = () => setReady(true);
    img.src = frameTemplate;
  }, []);

  // Render canvas whenever anything changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, cw, ch);

    ctx.fillStyle = "#090e1a";
    ctx.fillRect(0, 0, cw, ch);

    if (userPhoto) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(frame.x, frame.y, frame.w, frame.h);
      ctx.clip();
      ctx.drawImage(
        userPhoto,
        pos.x,
        pos.y,
        userPhoto.naturalWidth * scale,
        userPhoto.naturalHeight * scale
      );
      ctx.restore();
    } else {
      ctx.save();
      ctx.beginPath();
      ctx.rect(frame.x, frame.y, frame.w, frame.h);
      ctx.clip();
      ctx.fillStyle = "#d0d8e8";
      ctx.fillRect(frame.x, frame.y, frame.w, frame.h);
      ctx.fillStyle = "#8898b0";
      ctx.font = `bold ${cw * 0.04}px Montserrat, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SUA FOTO AQUI", frame.x + frame.w / 2, frame.y + frame.h / 2);
      ctx.restore();
    }

    if (overlay) {
      ctx.drawImage(overlay, 0, 0, cw, ch);
    }
  }, [userPhoto, pos, scale, overlay, frame, cw, ch]);

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleFile = (file) => {
    if (!file?.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const autoScale = Math.max(
          frame.w / img.naturalWidth,
          frame.h / img.naturalHeight
        );
        setScale(autoScale);
        setPos({ x: frame.x, y: frame.y });
        setUserPhoto(img);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => handleFile(e.target.files[0]);
  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  // ── Coordenadas do canvas (responsivo) ───────────────────────────────────
  const toCanvas = (clientX, clientY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (cw / rect.width),
      y: (clientY - rect.top) * (ch / rect.height),
    };
  };

  // ── Mouse ─────────────────────────────────────────────────────────────────
  const onMouseDown = (e) => {
    if (!userPhoto) return;
    const c = toCanvas(e.clientX, e.clientY);
    dragRef.current = {
      dragging: true,
      startX: c.x,
      startY: c.y,
      posAtStart: { ...pos },
    };
  };

  const onMouseMove = (e) => {
    if (!dragRef.current.dragging) return;
    const c = toCanvas(e.clientX, e.clientY);
    setPos({
      x: dragRef.current.posAtStart.x + c.x - dragRef.current.startX,
      y: dragRef.current.posAtStart.y + c.y - dragRef.current.startY,
    });
  };

  const onMouseUp = () => {
    dragRef.current.dragging = false;
  };

  const onWheel = (e) => {
    if (!userPhoto) return;
    e.preventDefault();
    setScale((s) =>
      Math.max(0.1, Math.min(8, s * (e.deltaY > 0 ? 0.93 : 1.07)))
    );
  };

  // ── Touch ─────────────────────────────────────────────────────────────────
  const onTouchStart = (e) => {
    if (!userPhoto) return;
    if (e.touches.length === 1) {
      const c = toCanvas(e.touches[0].clientX, e.touches[0].clientY);
      dragRef.current = {
        dragging: true,
        startX: c.x,
        startY: c.y,
        posAtStart: { ...pos },
      };
    } else if (e.touches.length === 2) {
      dragRef.current.dragging = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchRef.current = {
        active: true,
        startDist: Math.hypot(dx, dy),
        scaleAtStart: scale,
      };
    }
  };

  const onTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length === 1 && dragRef.current.dragging) {
      const c = toCanvas(e.touches[0].clientX, e.touches[0].clientY);
      setPos({
        x: dragRef.current.posAtStart.x + c.x - dragRef.current.startX,
        y: dragRef.current.posAtStart.y + c.y - dragRef.current.startY,
      });
    } else if (e.touches.length === 2 && pinchRef.current.active) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      setScale(
        Math.max(
          0.1,
          Math.min(
            8,
            pinchRef.current.scaleAtStart *
              (Math.hypot(dx, dy) / pinchRef.current.startDist)
          )
        )
      );
    }
  };

  const onTouchEnd = () => {
    dragRef.current.dragging = false;
    pinchRef.current.active = false;
  };

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = () => {
    const link = document.createElement("a");
    link.download = "eu-vou-congresso-autismo-ma-2026.png";
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  // ── Resetar posição ───────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    if (!userPhoto) return;
    setScale(
      Math.max(frame.w / userPhoto.naturalWidth, frame.h / userPhoto.naturalHeight)
    );
    setPos({ x: frame.x, y: frame.y });
  }, [userPhoto, frame]);

  return (
    <div className={styles.page}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            Crie seu <span>EU VOU!</span>
          </h1>
          <p className={styles.subtitle}>
            Faça upload da sua foto, posicione dentro da moldura e baixe para
            postar!
          </p>
        </div>

        {/* Canvas */}
        <div
          className={styles.canvasWrapper}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <canvas
            ref={canvasRef}
            width={cw}
            height={ch}
            className={styles.canvas}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{
              cursor: userPhoto ? "grab" : "default",
              touchAction: "none",
            }}
          />
          {!userPhoto && (
            <label className={styles.dropOverlay} htmlFor="photo-upload">
              <span className={styles.dropIcon}>📷</span>
              <span>Clique ou arraste uma foto aqui</span>
            </label>
          )}
        </div>

        {/* Controles */}
        <div className={styles.controls}>
          <label className={styles.uploadBtn} htmlFor="photo-upload">
            📷 {userPhoto ? "Trocar foto" : "Escolher foto"}
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              hidden
            />
          </label>

          {userPhoto && (
            <>
              <div className={styles.sliderRow}>
                <span>🔍</span>
                <input
                  type="range"
                  min="0.1"
                  max="8"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className={styles.slider}
                />
              </div>

              <button className={styles.resetBtn} onClick={handleReset}>
                ↺ Centralizar
              </button>

              <button className={styles.downloadBtn} onClick={handleDownload}>
                ⬇ Baixar imagem
              </button>
            </>
          )}
        </div>

        {userPhoto && (
          <p className={styles.hint}>
            Arraste a foto para reposicionar · Role o mouse ou use o slider para
            zoom · No celular use dois dedos para dar zoom
          </p>
        )}
      </div>
    </div>
  );
};

export default PhotoFrame;
