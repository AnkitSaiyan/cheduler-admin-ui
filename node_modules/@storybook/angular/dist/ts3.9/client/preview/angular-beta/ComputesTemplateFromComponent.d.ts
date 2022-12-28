import type { Type } from '@angular/core';
import type { ArgTypes } from '@storybook/api';
import type { ICollection } from '../types';
/**
 * Converts a component into a template with inputs/outputs present in initial props
 * @param component
 * @param initialProps
 * @param innerTemplate
 */
export declare const computesTemplateFromComponent: (component: Type<unknown>, initialProps?: ICollection, innerTemplate?: string) => string;
/**
 * Converts a component into a template with inputs/outputs present in initial props
 * @param component
 * @param initialProps
 * @param innerTemplate
 */
export declare const computesTemplateSourceFromComponent: (component: Type<unknown>, initialProps?: ICollection, argTypes?: ArgTypes) => string;
