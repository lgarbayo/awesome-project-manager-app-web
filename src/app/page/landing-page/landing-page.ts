import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPage implements AfterViewInit, OnDestroy {
  @ViewChild('bgVideo') private bgVideo?: ElementRef<HTMLVideoElement>;
  private cleanup: Array<() => void> = [];

  protected readonly titleLetters = Array.from('Awesome Project Manager');
  protected readonly trackLetter = (index: number): number => index;

  ngAfterViewInit(): void {
    const video = this.bgVideo?.nativeElement;
    if (!video) {
      return;
    }
    const play = () => this.tryPlay(video);

    if (video.readyState >= 2) {
      play();
    } else {
      video.addEventListener('canplay', play, { once: true });
      this.cleanup.push(() => video.removeEventListener('canplay', play));
    }

    const visibilityHandler = () => {
      if (!document.hidden) {
        play();
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);
    this.cleanup.push(() => document.removeEventListener('visibilitychange', visibilityHandler));

    const interactionHandler = () => play();
    document.addEventListener('pointerdown', interactionHandler, { once: true });
    this.cleanup.push(() => document.removeEventListener('pointerdown', interactionHandler));
  }

  ngOnDestroy(): void {
    this.cleanup.forEach((fn) => fn());
    this.cleanup = [];
  }

  private tryPlay(video: HTMLVideoElement): void {
    video.muted = true;
    const attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => {
        setTimeout(() => {
          const retry = video.play();
          if (retry && typeof retry.catch === 'function') {
            retry.catch(() => void 0);
          }
        }, 250);
      });
    }
  }
}
