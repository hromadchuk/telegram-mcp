import { useEffect, useRef } from 'react';
import QRCodeStyling from 'qr-code-styling';

import styles from './ConnectPage.module.css';
import telegramLogo from './telegram-logo.svg';

interface QrCodeProps {
  value: string;
}

export function QrCode({ value }: QrCodeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const qrCode = new QRCodeStyling({
      type: 'svg',
      width: 240,
      height: 240,
      margin: 0,
      data: value,
      image: telegramLogo,
      qrOptions: {
        errorCorrectionLevel: 'H',
      },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: 0.28,
        margin: 5,
      },
      dotsOptions: {
        color: '#229ed9',
        type: 'rounded',
      },
      cornersSquareOptions: {
        color: '#229ed9',
        type: 'extra-rounded',
      },
      cornersDotOptions: {
        color: '#229ed9',
        type: 'dot',
      },
      backgroundOptions: {
        color: '#ffffff',
      },
    });

    qrCode.append(container ?? undefined);

    return () => {
      container?.replaceChildren();
    };
  }, [value]);

  return <div className={styles.qrCode} ref={containerRef} />;
}
