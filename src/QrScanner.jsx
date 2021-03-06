import React from "react";
import jsQR from "jsqr";

const QrCodeScanner = ({ onScan, onGetFileData, autoPlay = true }) => {
  const [ctx, setCtx] = React.useState();
  const [torch, setTorch] = React.useState(null);
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  const requestRef = React.useRef(null);
  const timeoutRef = React.useRef(null);
  const inputFileRef = React.useRef(null);

  console.log(torch);
  const handleSetFile = () => {
    inputFileRef.current.click();
  };

  /**
   * Convert the uploaded file to ImageData and get the code of qrcode by jsQr.
   * @param {React.ChangeEvent<HTMLInputElement>} event
   */
  const handleInputFileChange = (event) => {
    const canvas = document.createElement("canvas");
    const currentCtx = canvas.getContext("2d");
    const reader = new FileReader();
    
    reader.onload = function (event) {
      const img = new Image();

      img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        currentCtx.drawImage(img, 0, 0);

        const imageData = currentCtx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        
        console.log('imageData', imageData);

        const code = jsQR(imageData.data, imageData.width, imageData.height);

        console.log(code)
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(event.target.files[0]);
  };

  /**
   * Draw an image of QrCode into canvas.
   * Get the image data as ImageData and get the code of qrcode by jsQr.
   */
  const tick = React.useCallback(() => {
    if (!ctx || !videoRef.current) {
      return;
    }

    timeoutRef.current = setTimeout(() => {
      const videoElement = videoRef.current;

      if (videoElement?.readyState === videoElement?.HAVE_ENOUGH_DATA) {
        const canvasElement = canvasRef.current;

        canvasElement.height = videoElement.videoHeight;
        canvasElement.width = videoElement.videoWidth;

        ctx.drawImage(
          videoElement,
          0,
          0,
          canvasElement.width,
          canvasElement.height
        );

        const imageData = ctx.getImageData(
          0,
          0,
          canvasElement.width,
          canvasElement.height
        );

        const code = jsQR(imageData.data, imageData.width, imageData.height);

        console.log('code', code);
        if (onScan instanceof Function && code) {
          onScan(code.data);
        }

        requestAnimationFrame(tick);
      }
    }, 300);
  }, [ctx, onScan]);

  React.useEffect(() => {
    if (!canvasRef.current || !videoRef.current || !navigator.mediaDevices) {
      return;
    }

    setCtx(canvasRef.current.getContext("2d"));

    let stream = null;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then(function(streamContext) {
        const track = streamContext.getVideoTracks()[0];
        
        setTorch(track);
        stream = streamContext;

        if (videoRef.current) {
          videoRef.current.srcObject = streamContext;
        }

        requestRef.current = requestAnimationFrame(tick);
      });

    return () => {
      cancelAnimationFrame(requestRef.current);
      clearTimeout(timeoutRef.current);
      if (stream) {
        stream.getTracks().forEach((item) => {
          item.stop();
        });
      }
    };
  }, [tick]);

  return (
    <div style={{ width: "100%", lineHeight: 0, position: "relative" }}>
      <button onClick={() => {
        torch.applyConstraints({
          advanced: [{torch: true}]
        });
      }}>test</button>
      <video
        ref={videoRef}
        autoPlay={autoPlay}
        playsInline
        style={{ width: "100%", borderRadius: "15px" }}
      />
      <canvas ref={canvasRef} hidden />

      <input
        type="file"
        accept="image/png, image/jpeg"
        hidden
        ref={inputFileRef}
        onChange={handleInputFileChange}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          position: "absolute",
          left: "12px",
          top: "12px",
          zIndex: 1,
        }}
      >
        <h2>test</h2>
        <h2>test</h2>
        <button
          onClick={handleSetFile}
          style={{
            width: "40px",
            height: "40px",
            backdropFilter: "blur(2.5px)",
            border: "solid 2px white",
            background: "transparent",
            borderRadius: "50%",
            marginBottom: "16px",
          }}
        >
          test
        </button>
      </div>
    </div>
  );
};

export default QrCodeScanner;
