/*
 *  Copyright 2022 Collate
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

import { Col, Row } from 'antd';
import { AxiosError } from 'axios';
import { compare } from 'fast-json-patch';
import { camelCase, startCase } from 'lodash';
import { ExtraInfo } from 'Models';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getListTestCase,
  getTestSuiteByName,
  ListTestCaseParams,
  updateTestSuiteById,
} from '../../axiosAPIs/testAPI';
import TabsPane from '../../components/common/TabsPane/TabsPane';
import { TitleBreadcrumbProps } from '../../components/common/title-breadcrumb/title-breadcrumb.interface';
import PageContainer from '../../components/containers/PageContainer';
import Loader from '../../components/Loader/Loader';
import TestCasesTab from '../../components/TestCasesTab/TestCasesTab.component';
import TestSuiteDetails from '../../components/TestSuiteDetails/TestSuiteDetails.component';
import TestSuitePipelineTab from '../../components/TestSuitePipelineTab/TestSuitePipelineTab.component';
import {
  getTeamAndUserDetailsPath,
  INITIAL_PAGING_VALUE,
  PAGE_SIZE,
  pagingObject,
} from '../../constants/constants';
import {
  GlobalSettingOptions,
  GlobalSettingsMenuCategory,
} from '../../constants/globalSettings.constants';
import { OwnerType } from '../../enums/user.enum';
import { TestCase } from '../../generated/tests/testCase';
import { TestSuite } from '../../generated/tests/testSuite';
import { Paging } from '../../generated/type/paging';
import jsonData from '../../jsons/en';
import { getEntityName, getEntityPlaceHolder } from '../../utils/CommonUtils';
import { getSettingPath } from '../../utils/RouterUtils';
import { showErrorToast } from '../../utils/ToastUtils';
import './TestSuiteDetailsPage.styles.less';

const TestSuiteDetailsPage = () => {
  const { testSuiteFQN } = useParams<Record<string, string>>();
  const [testSuite, setTestSuite] = useState<TestSuite>();
  const [isDescriptionEditable, setIsDescriptionEditable] = useState(false);
  const [isDeleteWidgetVisible, setIsDeleteWidgetVisible] = useState(false);
  const [isTestCaseLoaded, setIsTestCaseLoaded] = useState(false);
  const [testCaseResult, setTestCaseResult] = useState<Array<TestCase>>([]);
  const [currentPage, setCurrentPage] = useState(INITIAL_PAGING_VALUE);
  const [testCasesPaging, setTestCasesPaging] = useState<Paging>(pagingObject);

  const [slashedBreadCrumb, setSlashedBreadCrumb] = useState<
    TitleBreadcrumbProps['titleLinks']
  >([]);

  const [activeTab, setActiveTab] = useState<number>(1);

  const tabs = [
    {
      name: 'Test Cases',
      isProtected: false,
      position: 1,
    },
    {
      name: 'Pipeline',
      isProtected: false,
      position: 2,
    },
  ];

  const { testSuiteDescription, testSuiteId, testOwner } = useMemo(() => {
    return {
      testOwner: testSuite?.owner,
      testSuiteId: testSuite?.id,
      testSuiteDescription: testSuite?.description,
    };
  }, [testSuite]);

  const saveAndUpdateTestSuiteData = (updatedData: TestSuite) => {
    const jsonPatch = compare(testSuite as TestSuite, updatedData);

    return updateTestSuiteById(testSuiteId as string, jsonPatch);
  };

  const descriptionHandler = (value: boolean) => {
    setIsDescriptionEditable(value);
  };

  const fetchTestCases = async (param?: ListTestCaseParams, limit?: number) => {
    setIsTestCaseLoaded(false);
    try {
      const response = await getListTestCase({
        fields: 'testCaseResult,testDefinition',
        testSuiteId: testSuiteId,
        limit: limit || PAGE_SIZE,
        before: param && param.before,
        after: param && param.after,
        ...param,
      });

      setTestCaseResult(response.data);
      setTestCasesPaging(response.paging);
    } catch {
      setTestCaseResult([]);
      showErrorToast(jsonData['api-error-messages']['fetch-test-cases-error']);
    } finally {
      setIsTestCaseLoaded(true);
    }
  };

  const afterSubmitAction = () => {
    fetchTestCases();
  };

  const fetchTestSuiteByName = async () => {
    try {
      const response = await getTestSuiteByName(testSuiteFQN, {
        fields: 'owner',
      });
      setSlashedBreadCrumb([
        {
          name: 'Test Suites',
          url: getSettingPath(
            GlobalSettingsMenuCategory.DATA_QUALITY,
            GlobalSettingOptions.TEST_SUITE
          ),
        },
        {
          name: startCase(
            camelCase(response?.fullyQualifiedName || response?.name)
          ),
          url: '',
        },
      ]);
      setTestSuite(response);
      fetchTestCases({ testSuiteId: response.id });
    } catch (error) {
      setTestSuite(undefined);
      showErrorToast(
        error as AxiosError,
        jsonData['api-error-messages']['fetch-test-suite-error']
      );
    }
  };

  const onUpdateOwner = (updatedOwner: TestSuite['owner']) => {
    if (updatedOwner) {
      const updatedTestSuite = {
        ...testSuite,
        owner: {
          ...testSuite?.owner,
          ...updatedOwner,
        },
      } as TestSuite;

      saveAndUpdateTestSuiteData(updatedTestSuite)
        .then((res) => {
          if (res) {
            setTestSuite(res);
          } else {
            showErrorToast(
              jsonData['api-error-messages']['unexpected-server-response']
            );
          }
        })
        .catch((err: AxiosError) => {
          showErrorToast(
            err,
            jsonData['api-error-messages']['update-owner-error']
          );
        });
    }
  };

  const onDescriptionUpdate = (updatedHTML: string) => {
    if (testSuite?.description !== updatedHTML) {
      const updatedTestSuite = { ...testSuite, description: updatedHTML };
      saveAndUpdateTestSuiteData(updatedTestSuite as TestSuite)
        .then((res) => {
          if (res) {
            setTestSuite(res);
          } else {
            throw jsonData['api-error-messages']['unexpected-server-response'];
          }
        })
        .catch((error: AxiosError) => {
          showErrorToast(
            error,
            jsonData['api-error-messages']['update-test-suite-error']
          );
        })
        .finally(() => {
          descriptionHandler(false);
        });
    } else {
      descriptionHandler(false);
    }
  };

  const onSetActiveValue = (tabValue: number) => {
    setActiveTab(tabValue);
  };

  const handleDescriptionUpdate = (updatedHTML: string) => {
    onDescriptionUpdate(updatedHTML);
  };

  const handleDeleteWidgetVisible = (isVisible: boolean) => {
    setIsDeleteWidgetVisible(isVisible);
  };

  const handleTestCasePaging = (
    cursorValue: string | number,
    activePage?: number | undefined
  ) => {
    setCurrentPage(activePage as number);
    fetchTestCases({
      [cursorValue]: testCasesPaging[cursorValue as keyof Paging] as string,
    });
  };

  const extraInfo: Array<ExtraInfo> = useMemo(
    () => [
      {
        key: 'Owner',
        value:
          testOwner?.type === 'team'
            ? getTeamAndUserDetailsPath(testOwner?.name || '')
            : getEntityName(testOwner) || '',
        placeholderText:
          getEntityPlaceHolder(
            (testOwner?.displayName as string) || (testOwner?.name as string),
            testOwner?.deleted
          ) || '',
        isLink: testOwner?.type === 'team',
        openInNewTab: false,
        profileName:
          testOwner?.type === OwnerType.USER ? testOwner?.name : undefined,
      },
    ],
    [testOwner]
  );

  useEffect(() => {
    fetchTestSuiteByName();
  }, []);

  return (
    <PageContainer>
      <Row className="tw-px-6 tw-w-full">
        <Col span={24}>
          <TestSuiteDetails
            descriptionHandler={descriptionHandler}
            extraInfo={extraInfo}
            handleDeleteWidgetVisible={handleDeleteWidgetVisible}
            handleDescriptionUpdate={handleDescriptionUpdate}
            handleUpdateOwner={onUpdateOwner}
            isDeleteWidgetVisible={isDeleteWidgetVisible}
            isDescriptionEditable={isDescriptionEditable}
            slashedBreadCrumb={slashedBreadCrumb}
            testSuite={testSuite}
            testSuiteDescription={testSuiteDescription}
          />
        </Col>
        <Col className="tw-mt-8" span={24}>
          <TabsPane
            activeTab={activeTab}
            setActiveTab={onSetActiveValue}
            tabs={tabs}
          />
          <div className="tw-mb-4">
            {activeTab === 1 && (
              <>
                {isTestCaseLoaded ? (
                  <TestCasesTab
                    currentPage={currentPage}
                    testCasePageHandler={handleTestCasePaging}
                    testCases={testCaseResult}
                    testCasesPaging={testCasesPaging}
                    onTestUpdate={afterSubmitAction}
                  />
                ) : (
                  <Loader />
                )}
              </>
            )}
            {activeTab === 2 && <TestSuitePipelineTab />}
          </div>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default TestSuiteDetailsPage;
