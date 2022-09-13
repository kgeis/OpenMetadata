/*
 *  Copyright 2021 Collate
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import { act, fireEvent, render } from '@testing-library/react';
import React, { ReactNode } from 'react';
import Signup from '.';
import * as AppState from '../../AppState';
import { createUser } from '../../axiosAPIs/userAPI';

const onChangeHandler = jest.fn();
const onSubmitHandler = jest.fn();
const mockShowErrorToast = jest.fn();

jest.mock('react-router-dom', () => ({
  useHistory: jest.fn().mockReturnValue({
    push: jest.fn(),
  }),
}));

jest.mock('../../authentication/auth-provider/AuthProvider', () => ({
  useAuthContext: jest.fn(() => ({
    setIsSigningIn: jest.fn(),
  })),
}));

jest.mock('../../components/TeamsSelectable/TeamsSelectable', () => {
  return jest.fn().mockImplementation(() => <div>TeamSelectable</div>);
});

jest.mock('../../components/buttons/Button/Button', () => ({
  Button: jest
    .fn()
    .mockImplementation(({ children }) => (
      <div data-testid="create-button">{children}</div>
    )),
}));

jest.mock('../../components/containers/PageContainer', () => {
  return jest
    .fn()
    .mockImplementation(({ children }: { children: ReactNode }) => (
      <div data-testid="PageContainer">{children}</div>
    ));
});

jest.mock('../../axiosAPIs/userAPI', () => ({
  createUser: jest.fn().mockResolvedValue({}),
}));

jest.mock('../../utils/ToastUtils', () => ({
  showErrorToast: mockShowErrorToast,
}));

describe('Test for Signup page', () => {
  it('Component should render properly', async () => {
    AppState.default.newUser = {
      name: 'Sample Name',
      email: 'sample123@sample.com',
      picture: 'Profile Picture',
    };
    AppState.default.updateUserDetails = jest.fn();

    (createUser as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({ data: {} })
    );

    const { getByTestId, queryByTestId } = render(<Signup />);

    const logo = getByTestId('om-logo');
    const heading = getByTestId('om-heading');
    const form = getByTestId('create-user-form');
    const fullNameLabel = getByTestId('full-name-label');
    const fullNameInput = getByTestId('full-name-input');
    const usernameLabel = getByTestId('username-label');
    const usernameInput = getByTestId('username-input');
    const emailLabel = getByTestId('email-label');
    const emailInput = getByTestId('email-input');
    const selectTeamLabel = getByTestId('select-team-label');
    const createButton = getByTestId('create-button');
    const loadingContent = await queryByTestId('loading-content');

    expect(logo).toBeInTheDocument();
    expect(heading).toBeInTheDocument();
    expect(form).toBeInTheDocument();
    expect(fullNameLabel).toBeInTheDocument();
    expect(fullNameInput).toBeInTheDocument();
    expect(usernameLabel).toBeInTheDocument();
    expect(usernameInput).toBeInTheDocument();
    expect(emailLabel).toBeInTheDocument();
    expect(emailInput).toBeInTheDocument();
    expect(selectTeamLabel).toBeInTheDocument();
    expect(createButton).toBeInTheDocument();
    expect(loadingContent).toBeNull();

    await act(async () => {
      form.onsubmit = onSubmitHandler;

      fireEvent.submit(form);

      expect(onSubmitHandler).toBeCalledTimes(1);
    });
  });

  it('Handlers in forms for change and submit should work properly', async () => {
    AppState.default.newUser = {
      name: 'Sample Name',
      email: 'sample123@sample.com',
      picture: 'Profile Picture',
    };
    AppState.default.updateUserPermissions = jest.fn();
    AppState.default.updateUserDetails = jest.fn();

    (createUser as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve(undefined)
    );

    const { getByTestId } = render(<Signup />);

    const form = getByTestId('create-user-form');
    const fullNameInput = getByTestId('full-name-input');
    const usernameInput = getByTestId('username-input');
    const emailInput = getByTestId('email-input');

    expect(form).toBeInTheDocument();
    expect(fullNameInput).toHaveValue('Sample Name');
    expect(usernameInput).toHaveValue('sample123');
    expect(emailInput).toHaveValue('sample123@sample.com');

    fullNameInput.onchange = onChangeHandler;
    usernameInput.onchange = onChangeHandler;
    emailInput.onchange = onChangeHandler;

    await act(async () => {
      fireEvent.change(fullNameInput, {
        target: { name: 'displayName', value: 'Fname Mname Lname' },
      });

      fireEvent.change(usernameInput, {
        target: { name: 'displayName', value: 'mockUserName' },
      });
      fireEvent.change(emailInput, {
        target: { name: 'displayName', value: 'sample@sample.com' },
      });

      expect(onChangeHandler).toBeCalledTimes(3);

      form.onsubmit = onSubmitHandler;

      fireEvent.submit(form);

      expect(onSubmitHandler).toBeCalledTimes(1);
    });
  });

  it('Error should be thrown if createUser API fails', async () => {
    AppState.default.newUser = {
      name: '',
      email: '',
      picture: '',
    };

    (createUser as jest.Mock).mockRejectedValueOnce('Test Error');

    const { getByTestId } = render(<Signup />);

    const form = getByTestId('create-user-form');
    const fullNameInput = getByTestId('full-name-input');
    const usernameInput = getByTestId('username-input');
    const emailInput = getByTestId('email-input');

    expect(form).toBeInTheDocument();
    expect(fullNameInput).toHaveValue('');
    expect(usernameInput).toHaveValue('');
    expect(emailInput).toHaveValue('');

    form.onsubmit = onSubmitHandler;
    await act(async () => {
      fireEvent.submit(form);

      expect(onSubmitHandler).toBeCalledTimes(1);
    });

    expect(mockShowErrorToast).toBeCalledTimes(1);
  });
});