import { redirect } from 'next/navigation';

/** Trang lá số cũ (bản demo) đã chuyển sang /la-so. */
export default function ChartPage() {
  redirect('/la-so');
}
