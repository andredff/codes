import { Component, OnInit, ViewChild } from '@angular/core';
import * as chart from 'chart.js';
import { UIChart } from "primeng/components/chart/chart";
import { SelectItem } from 'primeng/primeng';
import { EmpresaService } from 'services';
import { EmpresaSelecionada } from '../providers';
import { ActivatedRoute } from '@angular/router';
import { UsuarioLogado } from './../providers/usuario-logado';
import { AppUtil } from '../util';
import { FormControl, FormGroup } from '@angular/forms';
import { Usuario } from 'entidades';

export function empresaSelecionadaFactory(rota: ActivatedRoute, usuarioLogado: UsuarioLogado, empService: EmpresaService) {
    return new EmpresaSelecionada(rota, usuarioLogado, empService);
}

@Component({
    selector: 'empresa-dados',
    templateUrl: 'empresa-dados.component.html',
    providers: [
        {
            provide: EmpresaSelecionada,
            useFactory: empresaSelecionadaFactory,
            deps: [ActivatedRoute, UsuarioLogado, EmpresaService]
        }
    ]
})

export class EmpresaDadosComponent implements OnInit {

    // @ViewChild(BaseChartDirective) chart: BaseChartDirective;

    @ViewChild("chart") chart: UIChart;
    
    usuario: Usuario;
    form = new FormGroup(this.criaControles());
    dataStatus: any;
    options: any;
    datas: number[] = [];
    labels: any[] = [];
    colors: any[] = [];
    charttest;
    chartRequest;
    filterLimit = 100;
    chartStatus;
    chartRep;
    totalCasos: any;
    statusAcordo: any;
    statusSemAcordo: any;
    statusNaoComparecimento: any;
    totalCasosRep: any = '';
    empresaId;
    empresa: any = {};
    id: string;
    selectedRep: string = '';
    totalReps: SelectItem[] = [];
    graficos;
    reps = [];
    selectedRepName: string;
    idEmpresa;

    constructor(private empService: EmpresaService, private usuarioLogado: UsuarioLogado, private route: ActivatedRoute) {

    }

    ngOnInit() {
        // this.id = this.route.snapshot.parent.params['id'];
        this.usuario = this.usuarioLogado.getUsuario();
        this.id = this.usuario.representada.id;
        
        this.empService.getRepresentantes(this.id).subscribe(reps => {
            this.reps = reps;
            for (let i = 0; i < reps.length; i++) {
                this.totalReps.push({ label: this.reps[i].pessoaRepresentante.nome, value: this.reps[i].id });
            }
        });

        this.empService.getEmpresa(this.id).subscribe(ret => {
            this.empresa = ret;
        });

        this.empService.getGrafico(this.id).subscribe(ret => {
            this.graficos = ret;
            ret = ret;
            this.chartSolicitacao();
            this.chartStatusCaso();
        });
        this.chartReps();
    }

    destroy() {
        this.chartRep.destroy();
    }

    updateChartRep() {
        this.totalCasos = '';
        this.statusAcordo = 0;
        this.statusSemAcordo = 0;
        this.statusNaoComparecimento = 0;
        this.chartRep.destroy();

        let x = this.selectedRep;

        this.empService.getGraficoRepresentante(x).subscribe(ret => {
            ret = ret;
                this.selectedRepName = ret.nome;
                // this.totalCasos = ret.totalCasosComAcordos;
                this.statusAcordo = ret.totalCasosComAcordos;
                this.statusSemAcordo = ret.totalCasosSemAcordos;
                this.statusNaoComparecimento = ret.totalCasosNaoComparecimento;
                this.chartReps();
        });

    }

    chartSolicitacao() {
        let canvas = <HTMLCanvasElement>document.getElementById("charttest");
        let ctx2 = canvas.getContext("2d");
        ctx2.canvas.width = 500;

        this.totalCasos = this.graficos.totalCasosEmpresa;
        let statusAceito = this.graficos.totalCasosAceitos;
        let statusNegado = this.graficos.totalCasosNegados;
        let statusAguardandoConvite = this.graficos.totalCasosAguardandoConvite;
        let statusAguardandoPagamento = this.graficos.totalCasosAguardandoPagamento;
        let statusCaducado = this.graficos.totalCasosCaducados;

        let config = {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [
                        statusAceito,
                        statusNegado,
                        statusAguardandoConvite,
                        statusAguardandoPagamento,
                        statusCaducado,
                    ],
                    backgroundColor: [
                        "#56B573",
                        "#6A37BC",
                        "#6D6D6F",
                        "#DEDEDE",
                        "#2C3E52",
                    ],
                    label: 'Status'
                }],
                labels: [
                    ["Pedido Aceito" + ' (' + statusAceito + ')'],
                    ["Pedido Negado" + ' (' + statusNegado + ')'],
                    ["Aguardando Convite" + ' (' + statusAguardandoConvite + ')'],
                    ["Aguardando Pagamento" + ' (' + statusAguardandoPagamento + ')'],
                    ["Caducado" + ' (' + statusCaducado + ')'],
                ],

            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                // padding: 20,
                legend: {
                    position: 'left',
                    labels: {
                        padding: 25,
                        lineCap: 'round',
                    }
                },
                title: {
                    display: false,
                    text: 'Status Solicitação',
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                },
                tooltips: {
                    callbacks: {
                        label: function (tooltipItem, data) {
                            let dataset = data.datasets[tooltipItem.datasetIndex];
                            let total = dataset.data.reduce(function (previousValue, currentValue, currentIndex, array) {
                                return previousValue + currentValue;
                            });
                            let currentValue = dataset.data[tooltipItem.index];
                            let precentage = Math.floor(((currentValue / total) * 100) + 0.5);
                            const label = data.labels[tooltipItem.index] + ':';
                            return label + precentage + "%";
                        }
                    }
                }
            }
        };
        this.charttest = new chart(ctx2, config);
    }

    chartStatusCaso() {
        let canvas = <HTMLCanvasElement>document.getElementById("chartStatus");
        let ctx = canvas.getContext("2d");
        ctx.canvas.width = 600;
        // ctx.canvas.height = 600;
        this.totalCasos = this.graficos.totalCasosEmpresa;
        let statusAcordo = this.graficos.totalCasosComAcordos;
        let statusSemAcordo = this.graficos.totalCasosSemAcordos;
        let statusNaoComparecimento = this.graficos.totalCasosNaoComparecimento;

        let config = {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [
                        statusAcordo,
                        statusSemAcordo,
                        statusNaoComparecimento,
                    ],
                    backgroundColor: [
                        "#56B573",
                        "#6A37BC",
                        "#6D6D6F",
                    ],
                    label: 'Status'
                }],
                labels: [
                    ["Com acordo" + ' (' + statusAcordo + ')'],
                    ["Sem acordo" + ' (' + statusSemAcordo + ')'],
                    ["Não comparecimento" + ' (' + statusNaoComparecimento + ')'],
                ],

            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                legend: {
                    position: 'left',
                    labels: {
                        padding: 25,
                    }
                },
                title: {
                    display: false,
                    text: 'Status dos casos',
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                },
                tooltips: {
                    callbacks: {
                        label: function (tooltipItem, data) {
                            let dataset = data.datasets[tooltipItem.datasetIndex];
                            let total = dataset.data.reduce(function (previousValue, currentValue, currentIndex, array) {
                                return previousValue + currentValue;
                            });
                            let currentValue = dataset.data[tooltipItem.index];
                            let precentage = Math.floor(((currentValue / total) * 100) + 0.5);
                            const label = data.labels[tooltipItem.index] + ':';
                            return label + precentage + "%";
                        }
                    }
                }
            }
        };
        this.chartStatus = new chart(ctx, config);
    }

    chartReps() {
        let canvas = <HTMLCanvasElement>document.getElementById("chartRep");
        let ctx = canvas.getContext("2d");
        ctx.canvas.width = 500;

        let config = {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [
                        this.statusAcordo,
                        this.statusSemAcordo,
                        this.statusNaoComparecimento,
                    ],
                    backgroundColor: [
                        "#56B573",
                        "#6A37BC",
                        "#6D6D6F",
                    ],
                    label: 'Status'
                }],
                labels: [
                    ["Com acordo" + ' (' + this.statusAcordo + ')'],
                    ["Sem acordo" + ' (' + this.statusSemAcordo + ')'],
                    ["Não comparecimento" + ' (' + this.statusNaoComparecimento + ')'],
                ],

            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                legend: {
                    position: 'left',
                    labels: {
                        padding: 25,
                    }
                },
                title: {
                    display: false,
                    text: 'Status dos casos',
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                },
                tooltips: {
                    callbacks: {
                        label: function (tooltipItem, data) {
                            let dataset = data.datasets[tooltipItem.datasetIndex];
                            let total = dataset.data.reduce(function (previousValue, currentValue, currentIndex, array) {
                                return previousValue + currentValue;
                            });
                            let currentValue = dataset.data[tooltipItem.index];
                            let precentage = Math.floor(((currentValue / total) * 100) + 0.5);
                            const label = data.labels[tooltipItem.index] + ':';
                            return label + precentage + "%";
                        }
                    }
                }
            }
        };
        this.totalCasosRep = this.statusAcordo + this.statusSemAcordo + this.statusNaoComparecimento;
        this.chartRep = new chart(ctx, config);
    }

    removeData(chart) {
        chart.data.labels.pop();
        chart.data.datasets.forEach((dataset) => {
            dataset.data.pop();
        });
        chart.update();
    }

    updateChartData(chart, data, dataSetIndex) {
        chart.data.datasets[dataSetIndex].data = data;
        chart.update();
    }

    getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    criaControles(): { [key: string]: FormControl } {
        let controles: any = {};
        controles['repId'] = AppUtil.criaControle();
        return controles;
    }


}
