/**
 * PrintCornerStamp - renders the etched BMC seal as a fixed-position
 * "stamp" in the bottom-right corner of every printed page.
 *
 * Most modern browsers (Chrome, Edge, Firefox) repeat fixed-position
 * elements on every printed page when printing from `@media print`,
 * which gives us the traditional "official government document" look
 * where the seal appears in the corner of every sheet of a multi-page
 * report. The element is `display: none` on screen so it never
 * interferes with the live UI.
 *
 * Mount this once at the top level of any page that exposes a printable
 * report (the same pages that use <PrintHeader>). Pairing it with the
 * colour BMC logo in the letterhead gives a complete government-document
 * aesthetic: colour brand on the letterhead, monochrome official seal
 * stamped on every page.
 */
export default function PrintCornerStamp() {
  return (
    <div className="print-stamp" aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/bmc_logo_sketch.png"
        alt=""
        width={96}
        height={96}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  );
}
