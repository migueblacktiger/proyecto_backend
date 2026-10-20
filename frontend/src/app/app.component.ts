import { Component, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, Subscription } from 'rxjs';
import { Page } from './app.types';
import { PermissionMatrixRow } from './features/permissions/models/permission.model';
import { PermissionDataService } from './features/permissions/services/permission-data.service';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { TopbarComponent } from './layout/topbar/topbar.component';

interface Sport { name:string; category:string; subs:string[]; status:'Activo'|'Inactivo'; description:string; teams:number; icon:string; }

@Component({
  selector:'app-root',
  standalone:true,
  imports:[
    CommonModule,
    FormsModule,
    RouterOutlet,
    SidebarComponent,
    TopbarComponent
  ],
  templateUrl:'./app.component.html'
})
export class AppComponent {
  page: Page = 'home';
  adminMode = false;
  mobileMenu = false;
  toast = '';
  search = '';
  statusFilter = 'Todos';
  selectedSport = 0;
  modal = false;
  editingSport = false;
  sportForm: Sport = this.blankSport();
  loginEmail=''; loginPassword=''; registerName=''; registerEmail=''; registerPassword='';
  roleSelected='Administrador';
  private dashboardSubscriptions = new Subscription();
  sports: Sport[] = [
    {name:'Fútbol',category:'Balón',subs:['Fútbol 11','Fútbol de salón','Fútbol callejero','Fútbol playa','Fútbol 5'],status:'Activo',description:'Deporte de equipo jugado entre dos conjuntos de once jugadores cada uno.',teams:12,icon:'⚽'},
    {name:'Baloncesto',category:'Balón',subs:['Baloncesto 5x5','Baloncesto 3x3'],status:'Activo',description:'Deporte de equipo en el que se busca introducir el balón en la canasta rival.',teams:8,icon:'🏀'},
    {name:'Voleibol',category:'Red',subs:['Voleibol de sala','Voleibol playa','Voleibol sentado'],status:'Activo',description:'Deporte de equipo en el que dos conjuntos se enfrentan separados por una red.',teams:10,icon:'🏐'},
    {name:'Tenis',category:'Raqueta',subs:['Tenis individual','Tenis dobles'],status:'Inactivo',description:'Deporte de raqueta que se disputa en una pista dividida por una red.',teams:4,icon:'🎾'},
    {name:'Natación',category:'Acuático',subs:['Natación en piscina'],status:'Activo',description:'Disciplina acuática de velocidad, resistencia y técnica.',teams:6,icon:'🌊'}
  ];
  users = [
    {name:'Carlos Admin',email:'carlos@sportmanager.co',role:'Administrador',status:'Activo',initials:'CA'},
    {name:'Laura Martínez',email:'laura.martinez@email.com',role:'Coordinador',status:'Activo',initials:'LM'},
    {name:'Andrés Rojas',email:'andres.rojas@email.com',role:'Operador',status:'Activo',initials:'AR'},
    {name:'Sofía Gómez',email:'sofia.gomez@email.com',role:'Juez Deportivo',status:'Pendiente',initials:'SG'}
  ];
  constructor(
    private router: Router,
    destroyRef: DestroyRef,
    private permissionData: PermissionDataService
  ) {
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(destroyRef)
    ).subscribe(event => this.syncPageWithRoute(event.urlAfterRedirects));
    this.syncPageWithRoute(this.router.url);
  }
  get roles():string[]{return this.permissionData.roles();}
  get permissions():PermissionMatrixRow[]{return this.permissionData.legacyMatrixRows();}
  get filteredSports(){return this.sports.filter(s=>(s.name.toLowerCase().includes(this.search.toLowerCase())||s.category.toLowerCase().includes(this.search.toLowerCase()))&&(this.statusFilter==='Todos'||s.status===this.statusFilter));}
  get currentSport(){return this.sports[this.selectedSport] ?? this.sports[0];}
  get assignedCount(){return this.permissions.reduce((n,p)=>n+p.values.filter(Boolean).length,0);}
  get allPermissions(){return this.permissions.reduce((n,p)=>n+p.values.length,0);}
  get groups(){return [...new Set(this.permissions.map(p=>p.group))];}
  nav(page:Page){
    this.mobileMenu=false;
    this.toast='';
    const route = this.routeForPage(page);
    if(route){
      this.router.navigateByUrl(route).catch(error=>console.error('Navigation failed.',error));
      return;
    }
    this.page=page;
    if(this.router.url!=='/'){
      this.router.navigateByUrl('/').catch(error=>console.error('Navigation failed.',error));
    }
  }
  private routeForPage(page:Page):string|undefined{
    switch(page){
      case 'dashboard':return '/dashboard';
      case 'permission-management':return '/permissions';
      case 'role-permission-assignment':return '/role-permissions';
      default:return undefined;
    }
  }
  private syncPageWithRoute(url:string):void{
    const path=url.split(/[?#]/,1)[0];
    switch(path){
      case '/dashboard':this.page='dashboard';break;
      case '/permissions':this.page='permission-management';break;
      case '/role-permissions':this.page='role-permission-assignment';break;
      case '/':
        if(this.isRoutedPage())this.page='home';
        break;
    }
  }
  onRouteActivate(component:unknown):void{
    if(!(component instanceof DashboardComponent))return;
    component.sportsCount=this.sports.length;
    this.dashboardSubscriptions.add(component.navigate.subscribe(page=>this.nav(page)));
    this.dashboardSubscriptions.add(component.notification.subscribe(message=>this.showToast(message)));
  }
  onRouteDeactivate(component:unknown):void{
    if(component instanceof DashboardComponent){
      this.dashboardSubscriptions.unsubscribe();
      this.dashboardSubscriptions=new Subscription();
    }
  }
  isRoutedPage():boolean{return ['dashboard','permission-management','role-permission-assignment'].includes(this.page);}
  openAdmin(){this.adminMode=true;this.nav('role-permissions');}
  exitAdmin(){this.adminMode=false;this.nav('dashboard');}
  blankSport():Sport{return {name:'',category:'',subs:[],status:'Activo',description:'',teams:0,icon:'🏅'};}
  openNewSport(){this.sportForm=this.blankSport();this.editingSport=false;this.modal=true;}
  openEditSport(s:Sport){this.sportForm={...s,subs:[...s.subs]};this.editingSport=true;this.modal=true;}
  updateSubs(value:string){this.sportForm.subs=value.split(',').map(s=>s.trim()).filter(Boolean);}
  saveSport(){if(!this.sportForm.name.trim()||!this.sportForm.category){this.showToast('Completa el nombre y la categoría del deporte.');return;}const duplicate=this.sports.some((s,i)=>s.name.toLowerCase()===this.sportForm.name.trim().toLowerCase()&&(!this.editingSport||i!==this.selectedSport));if(duplicate){this.showToast('Ya existe un deporte con ese nombre.');return;}if(this.editingSport)this.sports[this.selectedSport]={...this.sportForm};else{this.sports.push({...this.sportForm});this.selectedSport=this.sports.length-1;}this.modal=false;this.showToast('Deporte guardado correctamente.');}
  deleteSport(index:number){const s=this.sports[index];if(s.teams>0){this.showToast(`No se puede eliminar «${s.name}» porque tiene equipos asociados.`);return;}if(confirm(`¿Eliminar el deporte ${s.name}?`)){this.sports.splice(index,1);this.selectedSport=0;this.showToast('Deporte eliminado.');}}
  selectSport(s:Sport){this.selectedSport=this.sports.indexOf(s);}
  togglePermission(row:PermissionMatrixRow,index:number){this.permissionData.toggleLegacyAssignment(row.name,index);}
  savePermissions(){this.showToast(`Permisos de ${this.roleSelected} guardados correctamente.`);}
  resetPermissions(){if(confirm('¿Restablecer la matriz de permisos a su último estado guardado?'))this.showToast('La matriz se ha restablecido.');}
  showToast(message:string){this.toast=message;setTimeout(()=>{if(this.toast===message)this.toast='';},3500);}
  login(){if(!this.loginEmail||!this.loginPassword){this.showToast('Ingresa tu correo y contraseña.');return;}this.adminMode=this.loginEmail.toLowerCase().includes('admin');this.nav(this.adminMode?'dashboard':'dashboard');this.showToast('Vista de demostración iniciada. Conecta el backend para autenticar credenciales.');}
  register(){if(!this.registerName||!this.registerEmail||!this.registerPassword){this.showToast('Completa todos los campos obligatorios.');return;}this.showToast('Formulario validado en modo demostración; aún no se crea una cuenta real.');}
  logout(){this.adminMode=false;this.nav('home');this.showToast('Sesión de demostración cerrada.');}
  isAdminPage():boolean{return ['users','roles','permissions','role-permissions','permission-management','role-permission-assignment'].includes(this.page);}
}
