/// <reference path="../.astro/types.d.ts" />
import type { UsuarioAutenticado } from "./modules/auth/services/auth.types";

declare global {
  namespace App {
    interface Locals {
      usuario?: UsuarioAutenticado;
    }
  }
}
