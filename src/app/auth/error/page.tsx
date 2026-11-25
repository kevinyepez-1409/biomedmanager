import Link from "next/link";
import { MarcoAcceso } from "@/components/MarcoAcceso";
import { botonPrimario, botonSecundario } from "@/components/estilos";

export const metadata = { title: "Enlace no válido" };

export default function ErrorConfirmacion() {
  return (
    <MarcoAcceso titulo="No se pudo confirmar tu correo">
      <p className="text-sm text-slate-600">
        El enlace no es válido, ya se usó o expiró. Algunos correos institucionales revisan los enlaces
        automáticamente y eso puede confirmar tu cuenta antes de que hagas clic: prueba primero a iniciar
        sesión con tu correo y contraseña. Si no puedes entrar, vuelve a registrarte para recibir un enlace
        nuevo.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/login" className={botonPrimario}>
          Iniciar sesión
        </Link>
        <Link href="/registro" className={botonSecundario}>
          Registrarme
        </Link>
      </div>
    </MarcoAcceso>
  );
}
