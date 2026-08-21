import type { UsuarioRed } from "./usuarios.types";

/**
 * Servicio encargado de gestionar los usuarios registrados en la Red de Aprendizaje
 */
export class ServicioUsuarios {
  private static usuarios: UsuarioRed[] = [
    {
      id: "usr-1",
      nombre: "Alejandro Fernando Haro",
      cedula: "1098765432",
      telefono: "315 892 4410",
      fechaNacimiento: "15 de Marzo, 2001",
      universidad: "Universidad Nacional de Colombia",
      carrera: "Ingeniería Ambiental",
      semestre: "8° Semestre",
      fechaRegistro: "2026-08-10",
      estado: "Activo",
    },
    {
      id: "usr-2",
      nombre: "Mirian Noemí Carranza",
      cedula: "1087654321",
      telefono: "300 456 7890",
      fechaNacimiento: "22 de Julio, 2002",
      universidad: "Universidad de Antioquia",
      carrera: "Sociología",
      semestre: "6° Semestre",
      fechaRegistro: "2026-08-14",
      estado: "Activo",
    },
    {
      id: "usr-3",
      nombre: "Carlos Eduardo Restrepo",
      cedula: "1076543210",
      telefono: "312 345 6789",
      fechaNacimiento: "05 de Noviembre, 2000",
      universidad: "Universidad del Valle",
      carrera: "Economía y Desarrollo Regional",
      semestre: "9° Semestre",
      fechaRegistro: "2026-08-18",
      estado: "Activo",
    },
    {
      id: "usr-4",
      nombre: "Daniela Salazar Nieto",
      cedula: "1065432109",
      telefono: "318 901 2345",
      fechaNacimiento: "18 de Enero, 2003",
      universidad: "Pontificia Universidad Javeriana",
      carrera: "Comunicación Social",
      semestre: "5° Semestre",
      fechaRegistro: "2026-08-19",
      estado: "Pendiente",
    },
    {
      id: "usr-5",
      nombre: "Roberto Ignacio Morales",
      cedula: "1054321098",
      telefono: "320 678 9012",
      fechaNacimiento: "30 de Septiembre, 2001",
      universidad: "Universidad Industrial de Santander",
      carrera: "Ingeniería de Sistemas",
      semestre: "7° Semestre",
      fechaRegistro: "2026-08-20",
      estado: "Activo",
    },
    {
      id: "usr-6",
      nombre: "Francisca Javiera Tapia",
      cedula: "1043210987",
      telefono: "311 234 5678",
      fechaNacimiento: "12 de Diciembre, 2002",
      universidad: "Universidad del Norte",
      carrera: "Administración de Empresas",
      semestre: "6° Semestre",
      fechaRegistro: "2026-08-21",
      estado: "Activo",
    },
  ];

  static async obtenerUsuarios(): Promise<UsuarioRed[]> {
    return this.usuarios;
  }

  static async obtenerUsuarioPorId(id: string): Promise<UsuarioRed | undefined> {
    return this.usuarios.find((u) => u.id === id);
  }
}
