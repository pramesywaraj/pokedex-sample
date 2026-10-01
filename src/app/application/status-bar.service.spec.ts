import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { STATUS_BAR_CONTENT } from '../data/platform/status-bar';
import { StatusBarService } from './status-bar.service';

describe('StatusBarService', () => {
  const setContentColour = vi.fn();

  function service(): StatusBarService {
    return TestBed.inject(StatusBarService);
  }

  beforeEach(() => {
    setContentColour.mockClear();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: STATUS_BAR_CONTENT, useValue: { setContentColour } }],
    });
  });

  it('holds a screen back while the boot cover is still up', () => {
    service().setContentColour('white');
    expect(setContentColour).not.toHaveBeenCalled();
  });

  it('applies what the first screen asked for once the cover has gone', () => {
    const statusBar = service();
    statusBar.setContentColour('white');
    statusBar.bootCoverGone();
    expect(setContentColour).toHaveBeenCalledWith('white');
  });

  it('keeps the red field white when no screen asked for anything', () => {
    service().bootCoverGone();
    expect(setContentColour).toHaveBeenCalledWith('white');
  });

  it('passes a colour straight through once the cover has gone', () => {
    const statusBar = service();
    statusBar.bootCoverGone();
    setContentColour.mockClear();

    statusBar.setContentColour('white');
    expect(setContentColour).toHaveBeenCalledWith('white');
  });

  it('resets to the dark icons the white canvas wants', () => {
    const statusBar = service();
    statusBar.bootCoverGone();
    setContentColour.mockClear();

    statusBar.resetToCanvas();
    expect(setContentColour).toHaveBeenCalledWith('black');
  });
});
