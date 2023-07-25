import { Component, OnInit } from '@angular/core';
import { AppointmentApiService } from 'src/app/core/services/appointment-api.service';
import { ModalService } from 'src/app/core/services/modal.service';
import { DestroyableComponent } from '../destroyable.component';
import { Subject, map, takeUntil } from 'rxjs';

@Component({
  selector: 'dfm-document-view-modal',
  templateUrl: './document-view-modal.component.html',
  styleUrls: ['./document-view-modal.component.scss']
})
export class DocumentViewModalComponent extends DestroyableComponent implements OnInit {

  public base64Start = 'data:image/jpeg;base64,';

  public image = new Subject();
  
  private downloadableImage!: string
  
  private fileName!: string;

  constructor(
    private modalSvc: ModalService,
    private appointmentApiSvc: AppointmentApiService,
  ) {
    super();
  }

  ngOnInit(): void {

    this.modalSvc.dialogData$.pipe(takeUntil(this.destroy$$)).subscribe((data) => {
     this.getDocument(data.id)
     })
  }

  public getDocument(id) {
    this.appointmentApiSvc.getDocumentById$(id).pipe(map(res => this.base64Start + res.fileData))

    this.appointmentApiSvc.getDocumentById$(id).subscribe(res => {
      this.image.next(this.base64Start + res.fileData);
      this.downloadableImage = this.base64Start + res.fileData;
      this.fileName = res.fileName
    })
    

    //   .subscribe(res => {
    //   console.log(res);
    //   this.image = res;
    // });
  }
  
  public downloadDocument() {
    const linkSource = this.downloadableImage
    const downloadLink = document.createElement('a');
    const fileName = this.fileName;
    downloadLink.href = linkSource;
    downloadLink.download = fileName;
    downloadLink.click();
  }

  public closeModal() {
    this.modalSvc.close();
  }

}
