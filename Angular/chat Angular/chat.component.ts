import { UsuarioLogado } from './../../../../providers/usuario-logado';
import { AppUtil } from './../../../../util/app.util';
import { Component, OnInit, ViewChild, ElementRef, EventEmitter, NgZone, Output, Injectable, OnDestroy, HostListener } from '@angular/core';
import { CasoService, StompService, SegurancaService, ToastService, ChatService } from '../../../../services';
import { FormControl, FormGroup } from '@angular/forms';
import { Caso } from '../../../../entidades';
import { Broadcaster } from '../../../../providers';
import { Constants } from '../../../../app/constants';
import { Subscription, Observable } from "rxjs";

@Component({
    selector: 'chat-sala',
    templateUrl: 'chat-sala.component.html',
})
@Injectable()
export class ChatSalaComponent implements OnInit, OnDestroy {

    @ViewChild('inputMsg') public inputMsg: ElementRef;
    @ViewChild('messages') public messages: ElementRef;

    @Output() onSalaSelecionada = new EventEmitter<string>();
    idCaso: string;
    caso: Caso;
    isMobile: boolean;
    messageForm: FormGroup;
    usernameForm: FormGroup;
    messageInput: any;
    messageArea: any;
    public static idClient: string;

    zone: NgZone;
    opt: any = { url: '' };
    optDrop: any = { url: '' };
    progress: number = 0;
    progressHtml: string = "0";
    response: any = {};
    uploadEvents: EventEmitter<any> = new EventEmitter();
    additionalData: any = { titulo: null };
    dropDialogVisible: boolean = false;

    sala: string; //nome da sala
    salaObj: any;
    emligacao: boolean = false;
    papel: string;
    subs: Subscription[] = [];
    displayControles: boolean = true;
    displayArquivos: boolean = true;

    public static role: any;

    public static broadcaster1: Broadcaster;

    partsJson: any;
    conviteConf: any;
    conviteDisplayed: boolean;
    fisrt = 0;
    selector: string = '.main-panel';
    loading;

    firstLoad: boolean = true;
    public isOnline: boolean;
    public showConnectionStatus: boolean;
    private showConnectionStatusSub: Subscription;
    private showConnectionStatusTimer: Observable<any>;
    first: boolean;
    loadComponent: boolean;
    disableForm: boolean = false;

    constructor(private chatService: ChatService,
        private broadcaster: Broadcaster,
        private stompService: StompService,
        private casoService: CasoService,
        private usuarioLogado: UsuarioLogado,
        private segService: SegurancaService, private toast: ToastService) {
        this.showConnectionStatusTimer = Observable.timer(5000);
    }


    ngOnInit() {
        this.messageForm = new FormGroup(this.criaControlesMessage());
        this.idCaso = this.casoService.idCasoSnapshot;
        this.caso = this.casoService.casoSelecionadoSnapshot;
        // this.inputMsg.nativeElement.disabled = true;

        setTimeout(() => {
            this.casoService.getCaso(this.idCaso).subscribe(ret => {
                if (ret.status === 'FINALIZADO' || ret.status === 'PRAMEDIACAO') {
                    // this.inputMsg.nativeElement.disabled = true;
                } else if (ret.status === 'EMMEDIACAO') {
                    // this.inputMsg.nativeElement.disabled = false;
                }
            });
        }, 1000);


        this.zone = new NgZone({ enableLongStackTrace: false });

        this.subs.push(
            this.broadcaster.on<any>(Broadcaster.EVENT_TWILIO_OFF).subscribe(data => {
                this.emligacao = false;
            })
        );
        this.subs.push(
            this.broadcaster.on<any>(Broadcaster.EVENT_TWILIO_ON).subscribe(data => {
                this.emligacao = true;
            })
        );


        // broadcaster de controle de caso
        this.subs.push(
            this.broadcaster.on<any>(Broadcaster.EVENT_CASO_FINALIZADO).subscribe(caso => {
                if (caso.codigoInterno === this.caso.codigoInterno) {
                    // this.inputMsg.nativeElement.disabled = true;
                    this.displayControles = false;
                    this.displayArquivos = true;
                    this.caso.status = 'FINALIZADO';
                    // console.log(':::: [broadcast] ' + Broadcaster.EVENT_CASO_FINALIZADO, caso);
                    // this.atualizaStatusCaso(caso);
                }
            })
        );

        this.subs.push(
            this.broadcaster.on<any>(Broadcaster.EVENT_CASO_PAUSADO).subscribe(caso => {
                if (caso.codigoInterno === this.caso.codigoInterno) {
                    // this.inputMsg.nativeElement.disabled = true;
                    this.displayControles = false;
                    this.displayArquivos = false;
                    this.caso.status = 'PRAMEDIACAO';
                    // console.log(':::: [broadcast] ' + Broadcaster.EVENT_CASO_PAUSADO, caso);
                    // this.atualizaStatusCaso(caso);
                }
            })
        );

        this.subs.push(
            this.broadcaster.on<any>(Broadcaster.EVENT_CASO_ABERTO).subscribe(caso => {
                if (caso.codigoInterno === this.caso.codigoInterno) {
                    // this.inputMsg.nativeElement.disabled = false;
                    this.displayControles = true;
                    this.displayArquivos = false;
                    this.caso.status = 'EMMEDIACAO';
                    // console.log(':::: [broadcast] ' + Broadcaster.EVENT_CASO_ABERTO, caso);
                    // this.atualizaStatusCaso(caso);
                }
            })
        );

        // controle de caso
        this.subs.push(
            this.casoService.getSetCaso(this.idCaso).subscribe(ret => {
                this.caso = ret;
                // console.log('<-- chatsala init', this.caso);
                // console.log(" STATUS >>>>>>", this.caso.status)
                if (this.caso.status === "EMMEDIACAO") {
                    // this.inputMsg.nativeElement.disabled = false;
                    this.displayControles = true;
                    this.displayArquivos = false;
                }
                if (this.caso.status === "ACORDADO") {
                    // this.inputMsg.nativeElement.disabled = false;
                    this.displayControles = true;
                    this.displayArquivos = false;
                }
                if (this.caso.status === "ACEITEACORDO") {
                    this.displayArquivos = false;
                    // this.inputMsg.nativeElement.disabled = false;
                }
                if (this.caso.status === "PRAMEDIACAO") {
                    // this.inputMsg.nativeElement.disabled = true;
                    this.displayControles = true;
                    this.displayArquivos = false;
                }
                if (this.caso.status === "FINALIZADO") {
                    // this.inputMsg.nativeElement.disabled = true;
                    this.displayControles = true;
                    this.displayArquivos = false;
                }
            })
        );

        this.papel = "MEDIADOR"
        this.sala = "GRUPO";
        this.onSalaSelecionada.emit(this.sala);
        this.chatService.getSala(this.idCaso, this.sala, this.papel).subscribe(s => {
            this.salaObj = s;
        });

        ChatSalaComponent.idClient = this.usuarioLogado.getUsuario().id;

        if (AppUtil.isMobile()) {
            this.isMobile = true;
        } else {
            this.isMobile = false;
        }

        // this.broadcaster.on<any>(Broadcaster.EVENT_LOAD).subscribe(data => {
        //     console.log('EVENT_LOAD ->', data);
        // });

        this.segService.getToken().subscribe(t => {
            //UPLOAD ARQUIVO
            this.opt = {
                url: Constants.API_ENDPOINT + 'arquivo/' + this.idCaso,
                //filterExtensions: true,
                autoUpload: false,
                previewUrl: false,
                allowedExtensions: ['image/png', 'image/jpg', 'application/pdf'],
                calculateSpeed: false,
                authToken: t,
                authTokenPrefix: 'Bearer'
            };
            this.optDrop = {
                url: Constants.API_ENDPOINT + 'arquivo/' + this.idCaso,
                autoUpload: false,
                calculateSpeed: false,
                authToken: t,
                authTokenPrefix: 'Bearer'
            };
        });


        if (this.usuarioLogado.usuario.usuarioMaster === true || this.usuarioLogado.usuario.usuarioTriagem === true) {
            this.messageForm.controls['message'].disable();
        }

        // this.inputMsg.nativeElement.disabled = false;

        // Conecta e recebe dados da sala do chat
        this.loadComponent = true;
        setInterval(() => {
            if (this.stompService.stompClient.ws.readyState === 1 && this.loadComponent === true) {
                this.subsToStomp();
                this.loadComponent = false;
            }
        }, 2000)
    }


    subsToStomp() {
        if (this.firstLoad) {
            this.stompService.subEvents();
            this.stompService.subEventsCaso();
            this.stompService.stompClient.subscribe('/channel/private/' + this.idCaso + '/GRUPO', this.onMessageReceived, {});
            this.stompService.stompClient.subscribe('/channel/private/' + this.idCaso + '/GRUPO/' + this.usuarioLogado.getUsuario().id, this.onMessageReceived, {});
            this.stompService.stompClient.send('/chat/getAllMessages/' + this.idCaso + '/GRUPO/' + this.usuarioLogado.getUsuario().id + '/0/5', {},
                JSON.stringify({ sender: this.stompService.username, type: 'JOIN', idSender: this.usuarioLogado.getUsuario().id }));
            document.getElementById('loading').style.display = 'flex';
            this.firstLoad = false;
        }
    }

    onUp() {
        if (this.stompService.stompClient.ws.readyState === 1) {
            let el = document.querySelector('#messageArea');
            if (el.scrollTop === 0) {
                this.fisrt++;
                let n = this.fisrt.toString();
                this.stompService.stompClient.send('/chat/getAllMessages/' + this.idCaso + '/GRUPO/' + this.usuarioLogado.getUsuario().id + '/' + n + '/5', {},
                    JSON.stringify({ sender: this.stompService.username, type: 'JOIN', idSender: this.usuarioLogado.getUsuario().id }));
                document.getElementById('loading').style.display = 'flex';

            }
        }
    }

    atualizaStatusCaso(caso: any = null) {
        if (caso && caso.status) {
            this.caso.status = caso.status;
        }
    }

    abreConf() {
        console.log('abre conf');
        this.broadcaster.broadcast(Broadcaster.EVENT_ABRE_CONF, this.idCaso);
    }


    onMessageReceived(payload) {
        let messageArea = document.querySelector('#messageArea');
        let message = JSON.parse("[" + payload.body + "]");
        let messageElement = document.createElement('li');

        if (message[0].type === 'JOIN') {
            // messageElement.classList.add('event-message');
            message[0].message = message[0].sender + ' está online!';
        } else if (message[0].type === 'LEAVE') {
            // messageElement.classList.add('event-message');
            message[0].message = message[0].sender + ' ficou offline!';

            // carrega mensagens anteriores
        } else if (message[0].length >= 1) {
            // return;
            message[0].reverse();
            for (let i = 0; i < message[0].length; i++) {

                let messageElement = document.createElement('li');
                messageElement.classList.add('chat-message');

                if (message[0][i].idSender === ChatSalaComponent.idClient) {
                    messageElement.classList.add('liClient')
                }

                // carrega avatar
                let avatarDiv = document.createElement('div');
                let avatarImg = document.createElement('img');
                let avatarText = message[0][i].avatarUrlSender;
                avatarImg.setAttribute('src', avatarText)
                avatarDiv.appendChild(avatarImg)
                messageElement.appendChild(avatarDiv);

                // carrega nome usuario
                let usernameDiv = document.createElement('div');
                let usernameElement = document.createElement('p');
                let usernameText = document.createTextNode(message[0][i].sender);
                usernameDiv.classList.add('user-div');
                usernameElement.classList.add('user-name');
                usernameElement.appendChild(usernameText);
                usernameDiv.appendChild(usernameElement)
                messageElement.appendChild(usernameDiv);

                // carrega role usuario & data hora mensagem
                let divElement = document.createElement('div');
                let roleDateDiv = document.createElement('div');
                let roleDateElement = document.createElement('p');
                let textElement = document.createElement('span');
                let dateElement = document.createElement('span');
                if (message[0][i].roleSender === 'SOLICITADA') {
                    ChatSalaComponent.role = document.createTextNode('CONVIDADA');
                } else {
                    ChatSalaComponent.role = document.createTextNode(message[0][i].roleSender);
                }
                let dateText = document.createTextNode(message[0][i].messageDate);
                roleDateDiv.classList.add('role-div');
                roleDateElement.classList.add('role-user');
                textElement.appendChild(ChatSalaComponent.role);
                dateElement.appendChild(dateText);
                dateElement.classList.add('right');
                roleDateElement.appendChild(textElement);
                roleDateElement.appendChild(dateElement);
                roleDateDiv.appendChild(roleDateElement)
                messageElement.appendChild(roleDateDiv);

                // carrega mensagem
                let textDiv = document.createElement('div');
                let textP = document.createElement('p');
                let messageText = document.createTextNode(message[0][i].message);
                textP.appendChild(messageText)
                textDiv.appendChild(textP);
                if (message[0][i].roleSender === 'SOLICITADA') {
                    textDiv.classList.add('textDivConvidado');
                } else if (message[0][i].roleSender === 'MEDIADOR') {
                    textDiv.classList.add('textDivMediador');
                } else {
                    textDiv.classList.add('textDiv');
                }
                textP.classList.add('innerText');
                messageElement.appendChild(textDiv);

                divElement.appendChild(messageElement)
                messageArea.appendChild(divElement);
                messageArea.insertBefore(divElement, messageArea.childNodes[0]);
                messageArea.scrollTop = messageArea.scrollHeight;
                let textarea = document.querySelector('#textarea');
                textarea.removeAttribute("disabled");

            }

            // cria mensagem nova
        } else {
            messageElement.classList.add('chat-message');
            if (message[0].idSender === ChatSalaComponent.idClient) {
                messageElement.classList.add('liClient');
            }

            if (message[0].length != 0) {
                let divElement = document.createElement('div');
                // cria avatar
                let avatarDiv = document.createElement('div');
                let avatarImg = document.createElement('img');
                let avatarText = message[0].avatarUrlSender;
                avatarImg.setAttribute('src', avatarText)
                avatarDiv.appendChild(avatarImg)
                messageElement.appendChild(avatarDiv);

                // cria nome usuario
                let usernameDiv = document.createElement('div');
                let usernameElement = document.createElement('p');
                let usernameText = document.createTextNode(message[0].sender);
                usernameDiv.classList.add('user-div');
                usernameElement.classList.add('user-name');
                usernameElement.appendChild(usernameText);
                usernameDiv.appendChild(usernameElement)
                messageElement.appendChild(usernameDiv);

                // carrega role usuario & data hora mensagem
                let roleDateDiv = document.createElement('div');
                let roleDateElement = document.createElement('p');
                let textElement = document.createElement('span');
                let dateElement = document.createElement('span');
                if (message[0].roleSender === 'SOLICITADA') {
                    ChatSalaComponent.role = document.createTextNode('CONVIDADA');
                } else {
                    ChatSalaComponent.role = document.createTextNode(message[0].roleSender);
                }
                let dateText = document.createTextNode(message[0].messageDate);
                roleDateDiv.classList.add('role-div');
                roleDateElement.classList.add('role-user');
                textElement.appendChild(ChatSalaComponent.role);
                dateElement.appendChild(dateText);
                dateElement.classList.add('right');
                roleDateElement.appendChild(textElement);
                roleDateElement.appendChild(dateElement);
                roleDateDiv.appendChild(roleDateElement)
                messageElement.appendChild(roleDateDiv);

                // cria mensagem
                let textDiv = document.createElement('div');
                let textP = document.createElement('p');
                let messageText = document.createTextNode(message[0].message);
                textP.appendChild(messageText)
                textDiv.appendChild(textP);
                if (message[0].roleSender === 'SOLICITADA') {
                    textDiv.classList.add('textDivConvidado');
                } else if (message[0].roleSender === 'MEDIADOR') {
                    textDiv.classList.add('textDivMediador');
                } else {
                    textDiv.classList.add('textDiv');
                }
                textP.classList.add('innerText');
                messageElement.appendChild(textDiv);
                divElement.appendChild(messageElement)
                messageArea.appendChild(divElement);
                messageArea.scrollTop = messageArea.scrollHeight;
            }
        }
        document.getElementById("loading").style.display = "none";
    }

    onError(error) {
        console.log('onError', error)
        let connectingElement = document.querySelector('.connecting');
        connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    }

    sendMessage(event) {

        this.messageInput = this.messageForm.controls.message.value.trim();
        let messageContent = this.messageInput;
        if (messageContent && this.stompService.stompClient) {
            let chatMessage = {
                sender: this.usuarioLogado.getUsuario().nome,
                message: this.messageInput,
                type: 'CHAT',
                idSender: this.usuarioLogado.getUsuario().id
            };
            this.stompService.stompClient.send('/chat/sendMessage/' + this.idCaso + '/GRUPO', {}, JSON.stringify(chatMessage));
            this.inputMsg.nativeElement.value = '';
            this.inputMsg.nativeElement.focus(null);
        }
        event.preventDefault();
    }

    criaControlesMessage(): { [key: string]: FormControl } {
        let controles: any = {};
        controles['message'] = AppUtil.criaControle();

        return controles;
    }

    volta() {
        history.back();
    }

    twilioConferencia() {
        // debugger;
        this.emligacao = true;
        this.partsJson = JSON.stringify(this.salaObj.participantesFiltrado);
        this.broadcaster.broadcast(Broadcaster.EVENT_TWILIO_CONFERENCIA, this.idCaso + '||' + this.partsJson);
    }

    handleUpload(data: any): void {
        //console.log('handleUpload');
        this.zone.run(() => {
            this.response = data;
            this.progress = data.progress.percent;
            this.progressHtml = data.progress.percent + '%';
            if (data.done) {
                if (data.error || data.status !== 200) {
                    this.toast.error('Erro ao enviar arquivo. O tamanho máximo é de 30MB');
                    return;
                }
                console.log('DONE DONE!!!!!!!! ' + this.progress);
                this.toast.info('Arquivo enviado.');
            }
        });
    }

    handleDropUpload(data: any) {
        this.zone.run(() => {
            this.response = data;
            this.progress = data.progress.percent;
            if (data.done) {
                if (data.error || data.status !== 200) {
                    this.toast.error('Erro ao enviar arquivo. O tamanho máximo é de 30MB');
                    return;
                }
                console.log('DONE DONE!!!!!!!! ' + this.progress);
                this.toast.info('Arquivo enviado.');
            }
        });
    }

    handleChange($event) {
        console.log('change ocorreu no fileselect ' + $event);
        this.dropDialogVisible = true;
    }

    startUpload() {
        //this.optDrop.data = { 'titulo': this.titulo };
        this.uploadEvents.emit('startUpload');
        this.dropDialogVisible = false;
    }

    handleDrop($event) {
        console.log('drop aqui ' + $event);
        this.dropDialogVisible = true;
    }

    @HostListener('window:offline', ['$event']) onOffline() {
        this.isOnline = false;
        this.showConnectionStatus = true;
        if (this.showConnectionStatusSub) {
            this.showConnectionStatusSub.unsubscribe();
        }
        console.log('closing ws')
        this.stompService.stompClient.ws.close();
        let textarea = document.querySelector('#textarea');
        textarea.setAttribute("disabled", "disabled");
    }

    @HostListener('window:online', ['$event']) onOnline() {
        this.showConnectionStatus = true;
        this.showConnectionStatusSub = this.showConnectionStatusTimer.subscribe(() => {
            this.showConnectionStatus = false;
            this.showConnectionStatusSub.unsubscribe();
            this.isOnline = true;

            let ul = document.querySelector('#messageArea');
            while (ul.firstChild) {
                ul.removeChild(ul.firstChild);
            }
            document.getElementById('loading').style.display = 'flex';
            this.first = true;
            setInterval(() => {
                if (this.stompService.stompClient.ws.readyState === 1 && this.first === true) {
                    this.stompService.subEvents();
                    this.stompService.subEventsCaso();
                    this.stompService.stompClient.subscribe('/channel/private/' + this.idCaso + '/GRUPO', this.onMessageReceived, {});
                    this.stompService.stompClient.subscribe('/channel/private/' + this.idCaso + '/GRUPO/' + this.usuarioLogado.getUsuario().id, this.onMessageReceived, {});
                    this.stompService.stompClient.send('/chat/getAllMessages/' + this.idCaso + '/GRUPO/' + this.usuarioLogado.getUsuario().id + '/0/5', {},
                        JSON.stringify({ sender: this.stompService.username, type: 'JOIN', idSender: this.usuarioLogado.getUsuario().id }));
                    document.getElementById('loading').style.display = 'flex';
                    this.firstLoad = false;
                    this.first = false;
                }
            }, 5000);
        });
    }

    ngOnDestroy() {
        for (const sub in this.stompService.stompClient.subscriptions) {
            if (this.stompService.stompClient.subscriptions.hasOwnProperty(sub)) {
                this.stompService.stompClient.unsubscribe(sub);
            }
        }
        if (this.showConnectionStatusSub) {
            this.showConnectionStatusSub.unsubscribe();
        }
    }

}

