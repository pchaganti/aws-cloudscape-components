// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { useAppLayoutToolbarEnabled } from '../../../app-layout/utils/feature-flags';
import { BreadcrumbsSlotContext } from '../../../app-layout/visual-refresh-toolbar/contexts';
import { BreadcrumbGroupProps } from '../../../breadcrumb-group/interfaces';
import { awsuiPluginsInternal } from '../api';
import { BreadcrumbsGlobalRegistration } from '../controllers/breadcrumbs';

function useSetGlobalBreadcrumbsImplementation({
  __disableGlobalization,
  ...props
}: BreadcrumbGroupProps<any> & { __disableGlobalization?: boolean }) {
  const { isInToolbar } = useContext(BreadcrumbsSlotContext) ?? {};
  const registrationRef = useRef<BreadcrumbsGlobalRegistration<BreadcrumbGroupProps> | null>();
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    if (isInToolbar || __disableGlobalization) {
      return;
    }
    const registration = awsuiPluginsInternal.breadcrumbs.registerBreadcrumbs(props, isRegistered =>
      setRegistered(isRegistered ?? true)
    );
    registrationRef.current = registration;

    return () => {
      registration.cleanup();
    };
    // subsequent prop changes are handled by another effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInToolbar, __disableGlobalization]);

  useLayoutEffect(() => {
    registrationRef.current?.update(props);
  });

  return registered;
}

export function useSetGlobalBreadcrumbs<T extends BreadcrumbGroupProps.Item>(props: BreadcrumbGroupProps<T>) {
  // avoid additional side effects when this feature is not active
  if (!useAppLayoutToolbarEnabled()) {
    return false;
  }
  // getGlobalFlag() value does not change without full page reload
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSetGlobalBreadcrumbsImplementation(props);
}

export function useGetGlobalBreadcrumbs(enabled: boolean) {
  const [discoveredBreadcrumbs, setDiscoveredBreadcrumbs] = useState<BreadcrumbGroupProps<any> | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    return awsuiPluginsInternal.breadcrumbs.registerAppLayout(breadcrumbs => {
      setDiscoveredBreadcrumbs(breadcrumbs);
    });
  }, [enabled]);

  return discoveredBreadcrumbs;
}