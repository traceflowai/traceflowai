import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Case } from '../../types';
import RiskPrediction from '../ai/RiskPrediction';
import CallSummary from '../ai/CallSummary';
import StatusBadge from '../common/StatusBadge';

interface CaseDetailsProps {
  caseData: Case | null;
  onClose: () => void;
}

export default function CaseDetails({ caseData, onClose }: CaseDetailsProps) {
  if (!caseData) return null;

  const mockRiskFactors = [
    {
      name: 'Suspicious Keywords',
      impact: (caseData.riskScore / 3).toFixed(2),
      description: 'Multiple high-risk terms detected in conversation',
    },
    {
      name: 'Call Pattern',
      impact: (caseData.riskScore / 2).toFixed(2),
      description: 'Unusual timing and frequency of calls',
    },
    {
      name: 'Historical Data',
      impact: (caseData.riskScore / 6).toFixed(2),
      description: 'Previous suspicious activities detected',
    },
  ];

  return (
    <Transition.Root show={Boolean(caseData)} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity dark:bg-gray-900 dark:bg-opacity-75" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg bg-gray-100 dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white dark:bg-gray-700 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div>
                  <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 dark:text-white mb-4">
                    Case #{caseData.id}
                  </Dialog.Title>

                  <div className="flex items-center space-x-4 mb-6">
                    <StatusBadge status={caseData.severity} />
                    <StatusBadge status={caseData.status} />
                    <span className="text-sm text-gray-500 dark:text-gray-400">{caseData.source}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <RiskPrediction
                    riskScore={caseData.riskScore}
                    factors={mockRiskFactors}
                  />
                  <CallSummary
                    summary= {caseData.summary}
                    keywords={caseData.flaggedKeywords || []}
                    sentiment="negative"
                    duration={caseData.duration.toString()}
                    timestamp={caseData.timestamp}
                  />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}