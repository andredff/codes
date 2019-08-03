import { Broadcaster } from './../providers/broadcaster';
import { OnInit, Component, NgZone, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl, FormGroup } from '@angular/forms';
import { Mediador, Usuario, Disponibilidade, UsuarioMediador } from '../entidades';
import { Constants } from '../app/constants';
import { ConsultaCepService, PessoaFisicaService, ToastService, SegurancaService, UFService, DisponibilidadeService, DiaSemanaService, MediadorService } from '../services';
import { SelectItem } from 'primeng/primeng';s
import { DateUtil, AppUtil } from '../util';
import { Location } from '@angular/common';
import { UsuarioLogado } from "../providers/index";

const URLc = Constants.API_ENDPOINT + 'cadastro/curriculo';
const URLt = Constants.API_ENDPOINT + 'cadastro/teorico';
const URLp = Constants.API_ENDPOINT + 'cadastro/pratico';

@Component({
    selector: 'perfil',
    templateUrl: 'perfil.component.html',
})
export class PerfilComponent implements OnInit {

    @ViewChild('cpf') public cpf: ElementRef;
    private zone: NgZone;
    private optT: Object = {};
    private optC: Object = {};
    private optP: Object = {};
    private optFoto: Object = {};
    private optFotoDrop: Object = {};
    private progressP: number = 0;
    private responseP: any = {};
    private progressT: number = 0;
    private responseT: any = {};
    private progressC: number = 0;
    private responseC: any = {};

    mediador: Mediador = new Mediador();

    generos: SelectItem[] = [];
    ufs: SelectItem[] = [];
    aceite: boolean;
    dtNascView: string;
    token: string;
    formado: boolean = true;
    edit: Disponibilidade = new Disponibilidade("", 0, null, null);

    form: FormGroup;
    formDisp: FormGroup;
    displayModal: boolean = false;
    displayEditor: boolean = false;
    usuario: Usuario;
    disp: any;
    dias: any;
    nomeView: string;
    idPF: string;
    exibirAltFoto: boolean = false;

    cepMask = AppUtil.CEP_MASK;
    cpfMask = AppUtil.CPF_MASK;
    dataMask = AppUtil.DATA_MASK;
    foneMask = AppUtil.FONE_MASK;
    celMask = AppUtil.CEL_MASK;
    anoMask = AppUtil.ANO_MASK;
    horaFullMask = [/\d/, /\d/];
    cnpjMask = AppUtil.CNPJ_MASK;

    usuarioMediador: UsuarioMediador = new UsuarioMediador();
    formulario: FormGroup;

    displayDados: boolean = true;
    displayEndereco: boolean = false;
    displayCurriculo: boolean = false;
    displayHorarios: boolean = false;

    constructor(private pfService: PessoaFisicaService, private toast: ToastService,
        private ufService: UFService, private router: Router, private segService: SegurancaService,
        private dispService: DisponibilidadeService, private diaSvc: DiaSemanaService,
        private broadcaster: Broadcaster, private _location: Location, private cepService: ConsultaCepService,
        private usuarioLogado: UsuarioLogado, private medService: MediadorService) {

    }

    ngOnInit() {
        this.zone = new NgZone({ enableLongStackTrace: false });
        this.dias = AppUtil.toSelectItems(this.diaSvc.getDias(), true);
        this.form = new FormGroup(this.criaControles());
        this.formDisp = new FormGroup(this.criaControlesDisp());
        this.usuario = this.usuarioLogado.getUsuario();
        this.nomeView = this.usuarioLogado.nome;
        this.carregaDisponibilidade(this.usuario);
        this.initMediador();
        this.ufs = AppUtil.toSelectItems(this.ufService.getUfs(), true);

        this.segService.getToken().subscribe(t => {
            this.token = t;
            this.optT = {
                url: URLt,
                filterExtensions: true,
                allowedExtensions: ['image/png', 'image/jpg'],
                calculateSpeed: true,
                authToken: this.token,
                authTokenPrefix: 'Bearer'
            };
            this.optC = {
                url: URLc,
                filterExtensions: true,
                allowedExtensions: ['image/png', 'image/jpg'],
                calculateSpeed: true,
                authToken: this.token,
                authTokenPrefix: 'Bearer'
            };
            this.optP = {
                url: URLp,
                filterExtensions: true,
                allowedExtensions: ['image/png', 'image/jpg'],
                calculateSpeed: true,
                authToken: this.token,
                authTokenPrefix: 'Bearer'
            };

            this.optFoto = {
                url: Constants.API_ENDPOINT + 'cadastro/foto',
                //filterExtensions: true,
                autoUpload: true,
                allowedExtensions: ['image/png', 'image/jpg'],
                authToken: t,
                authTokenPrefix: 'Bearer'
            };
            this.optFotoDrop = {
                url: Constants.API_ENDPOINT + 'cadastro/foto',
                //filterExtensions: true,
                autoUpload: true,
                allowedExtensions: ['image/png', 'image/jpg'],
                authToken: t,
                authTokenPrefix: 'Bearer'
            };
        });

        this.form.controls['email'].disable();
        if (this.usuario.pessoaFisica.cpf != null) {
            this.form.controls['cpf'].disable();
        }
    }

    showDados() {
        this.displayDados = true;
        this.displayEndereco = false;
        this.displayCurriculo = false;
        this.displayHorarios = false;
    }

    showEndereco() {
        this.displayDados = false;
        this.displayCurriculo = false;
        this.displayHorarios = false;
        this.displayEndereco = true;
    }

    showCurriculo() {
        this.displayDados = false;
        this.displayEndereco = false;
        this.displayHorarios = false;
        this.displayCurriculo = true;
    }

    showHorarios() {
        this.displayDados = false;
        this.displayEndereco = false;
        this.displayCurriculo = false;
        this.displayHorarios = true;
    }


    carregaDisponibilidade(usu: Usuario) {
        if (this.usuarioLogado.isRepresentante || this.usuarioLogado.isSupervisor) {
            this.dispService.listByUsuario(usu.id).subscribe(disp => {
                this.disp = disp;
            });
        }
    }

    initMediador() {
        if (this.usuarioLogado.isMediador) {
            this.medService.getMediador().subscribe(med => {
                this.mediador = med;
                this.usuarioMediador.mediador.miniCurriculo = this.mediador.miniCurriculo;
                this.displayEditor = true;
            });
        }
    }

    handleUploadT(data: any): void {
        this.zone.run(() => {
            this.responseT = data;
            this.progressT = data.progress.percent;
        });
    }
    handleUploadP(data: any): void {
        this.zone.run(() => {
            this.responseP = data;
            this.progressP = data.progress.percent;
        });
    }
    handleUploadC(data: any): void {
        this.zone.run(() => {
            this.responseC = data;
            this.progressC = data.progress.percent;
        });
    }
    handleUploadFoto(data: any): void {
        this.zone.run(() => {
            this.broadcaster.broadcast(Broadcaster.EVENT_LOADING_START);
            if (data && data.response && data.progress.percent === 100) {
                this.broadcaster.broadcast(Broadcaster.EVENT_LOADING_STOP);
                this.usuario.avatarUrl = data.response + '?' + new Date().getTime();
            }
        });
    }

    criaControles(): { [key: string]: FormControl } {
        let controles: any = {};
        controles['nome'] = AppUtil.criaControle();
        controles['email'] = AppUtil.criaControle();
        controles['cpf'] = AppUtil.criaControle('cpf');
        controles['rg'] = AppUtil.criaControle();
        controles['orgaoEmissor'] = AppUtil.criaControle();
        controles['ufOrgaoEmissor'] = AppUtil.criaControle();
        controles['genero'] = AppUtil.criaControle();
        controles['dtNascimento'] = AppUtil.criaControle('date');
        controles['cep'] = AppUtil.criaControle('cep');
        controles['endereco'] = AppUtil.criaControle();
        controles['uf'] = AppUtil.criaControle();
        controles['cidade'] = AppUtil.criaControle();
        controles['complemento'] = AppUtil.criaControle();
        controles['fone'] = AppUtil.criaControle();
        controles['celular'] = AppUtil.criaControle();
        controles['formacao'] = AppUtil.criaControle();
        controles['instituicao'] = AppUtil.criaControle();
        controles['anoFormacao'] = AppUtil.criaControle();
        controles['formado'] = AppUtil.criaControle();
        controles['aceite'] = AppUtil.criaControle();
        controles['miniCurriculo'] = AppUtil.criaControle(null, null, false);

        return controles;
    }

    criaControlesDisp(): { [key: string]: FormControl } {
        let controles: any = {};

        controles['dia'] = AppUtil.criaControle();
        controles['ini'] = AppUtil.criaControle();
        controles['fim'] = AppUtil.criaControle();

        return controles;
    }

    salva() {
        this.usuario.pessoaFisica.dtNascimento = DateUtil.toModel(this.dtNascView);
        this.usuario.pessoaFisica.nome = this.nomeView;
        this.usuario.pessoaFisica.cpf = this.form.controls['cpf'].value;
        if (this.usuarioLogado.isMediador) {
            delete this.usuario.pessoaFisica.id;
            Object.assign(this.mediador, this.usuario.pessoaFisica);
            this.mediador.miniCurriculo = this.usuarioMediador.mediador.miniCurriculo;
            this.mediador.pessoaFisica = this.usuario.pessoaFisica;
            this.medService.atualizaMeuMediador(this.mediador).subscribe(() => {
                this.toast.info('Perfil atualizado com sucesso');
            }, error => {
                this.toast.error(error);
            });
        } else {
            this.pfService.atualizaMinhaPF(this.usuario.pessoaFisica).subscribe(ret => {
                this.toast.info('Perfil atualizado com sucesso');
            }, error => {
                this.toast.error(error);
            });
        }
    }

    ok() {
        this.router.navigate(['/']);
    }

    backClicked() {
        this._location.back();
    }

    mostrarAltFoto() {
        this.exibirAltFoto = !this.exibirAltFoto;
    }

    esconderAltFoto() {
        this.exibirAltFoto = false;
    }

    adiciona() {
        let tmpdisp = new Disponibilidade("NOVO", 0, null, null);
        this.edit = tmpdisp;
        this.disp.push(tmpdisp);

    }

    edita(id: string) {
        for (let dia in this.disp) {
            if (this.disp[dia].id === id) {
                this.edit = this.disp[dia];
            }
        }
    }

    salvaDisp(id: string) {
        for (let dia in this.disp) {
            if (this.disp[dia].id === id) {
                if (this.edit.id === "NOVO") {
                    this.disp[dia].id = null;
                }
                this.dispService.salvaDisp(this.disp[dia]).subscribe(ret => {
                    this.edit = new Disponibilidade("", 0, null, null);
                    this.carregaDisponibilidade(this.usuario);
                });
            }
        }
    }

    cancelDisp() {    
        this.carregaDisponibilidade(this.usuario);
        this.edit = new Disponibilidade("", 0, 0, 0);
    }

    remove(id: string) {
        let newDisp: Disponibilidade[] = [];
        for (let dia in this.disp) {
            if (this.disp[dia].id !== id) {
                newDisp.push(this.disp[dia]);
            } else {
                if (id !== "NOVO") {
                    this.dispService.removeDisp(id).subscribe(ret => {
                        this.carregaDisponibilidade(this.usuario);
                    });
                }
            }
        }
        this.disp = newDisp;
    }

    resetar() {
        this.formulario.reset();
    }

    consultaCEP() {
        let cep = this.usuario.pessoaFisica.cep;
        this.cepService.consultaCEP(cep, this.resetaDadosForm, this.form)
            .subscribe(dados => this.populaDadosForm(dados));
    }

    populaDadosForm(dados) {
        this.form.patchValue({
            endereco: dados.logradouro,
            cep: dados.cep,
            cidade: dados.localidade,
            uf: dados.uf

        });
    }

    resetaDadosForm(form) {
        form.patchValue({
            endereco: null,
            cidade: null,
            uf: null
        });
    }

    omitSpecialChar(event) {
        var k;
        k = event.charCode;
        return ((k > 64 && k < 91) || (k > 96 && k < 123) || k == 8 || k == 32 || (k >= 48 && k <= 57));
    }

}