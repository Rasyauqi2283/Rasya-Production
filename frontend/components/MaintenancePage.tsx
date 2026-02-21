export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-rasya-dark px-6 text-center">
      <div className="max-w-md">
        <h1 className="mb-3 text-2xl font-bold text-white sm:text-3xl">
          Sedang dalam pemeliharaan
        </h1>
        <p className="text-zinc-400">
          Situs sementara tidak tersedia. Kami akan segera kembali. Terima kasih
          atas pengertian Anda.
        </p>
        <p className="mt-6 text-sm text-zinc-500">
          Rasya Production
        </p>
      </div>
    </div>
  );
}
